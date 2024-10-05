require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const { Pool } = require("pg");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");

const app = express();
app.use(express.json());

// PostgreSQL setup using environment variables
const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

// Multer configuration to limit file types and size
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Invalid file type. Only JPEG, PNG, and GIF are allowed."
                )
            );
        }
        cb(null, true);
    },
});

// Serve static files from 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
        return res
            .status(403)
            .json({ error: "Token is required for authentication" });

    const token = authHeader.split(" ")[1]; // Assuming 'Bearer TOKEN'
    if (!token)
        return res
            .status(403)
            .json({ error: "Token is required for authentication" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).json({ error: "Invalid Token" });
    }
    return next();
};

// User Registration
app.post(
    "/register",
    [
        body("username")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("Username is required"),
        body("password")
            .isString()
            .notEmpty()
            .withMessage("Password is required"),
        body("email")
            .isEmail()
            .normalizeEmail()
            .withMessage("Invalid email format"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, email } = req.body;

        try {
            // Check if username already exists
            const usernameCheck = await pool.query(
                "SELECT id FROM users WHERE username = $1",
                [username]
            );
            if (usernameCheck.rows.length > 0) {
                return res
                    .status(400)
                    .json({ error: "Username already in use" });
            }

            // Check if email already exists
            const emailCheck = await pool.query(
                "SELECT id FROM users WHERE email = $1",
                [email]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: "Email already in use" });
            }

            // Proceed to create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await pool.query(
                "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username",
                [username, hashedPassword, email]
            );

            return res.status(201).json({
                message: "User created successfully",
                userId: result.rows[0].id,
                username: result.rows[0].username,
            });
        } catch (err) {
            console.error("Error during user registration:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// User Login
app.post(
    "/login",
    [
        body("username")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("Username is required"),
        body("password")
            .isString()
            .notEmpty()
            .withMessage("Password is required"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            const result = await pool.query(
                "SELECT * FROM users WHERE username = $1",
                [username]
            );

            if (result.rows.length === 0) {
                return res
                    .status(400)
                    .json({ error: "Invalid username or password" });
            }

            const user = result.rows[0];
            const validPassword = await bcrypt.compare(password, user.password);

            if (!validPassword) {
                return res
                    .status(400)
                    .json({ error: "Invalid username or password" });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
                expiresIn: "1h",
            });

            return res.json({ token });
        } catch (err) {
            console.error("Error during login:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Get User Profile
// Get user profile
app.get("/profile", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email, profile_image FROM users WHERE id = $1",
            [req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];
        user.profile_image_url = `/uploads/${user.profile_image}`; // Return the image URL

        return res.json(user);
    } catch (err) {
        console.error("Error fetching user profile:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Update User
app.put(
    "/profile",
    verifyToken,
    [
        body("username")
            .optional()
            .isString()
            .trim()
            .withMessage("Username must be a string"),
        body("email")
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage("Invalid email format"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email } = req.body;

        // Check if either username or email is provided
        if (!username && !email) {
            return res
                .status(400)
                .json({ error: "No data provided to update" });
        }

        try {
            // Check if username already exists for another user, if provided
            if (username) {
                const usernameCheck = await pool.query(
                    "SELECT id FROM users WHERE username = $1 AND id != $2",
                    [username, req.user.userId]
                );
                if (usernameCheck.rows.length > 0) {
                    return res
                        .status(400)
                        .json({ error: "Username already in use" });
                }
            }

            // Check if email already exists for another user, if provided
            if (email) {
                const emailCheck = await pool.query(
                    "SELECT id FROM users WHERE email = $1 AND id != $2",
                    [email, req.user.userId]
                );
                if (emailCheck.rows.length > 0) {
                    return res
                        .status(400)
                        .json({ error: "Email already in use" });
                }
            }

            // Prepare dynamic query and params array
            const updateFields = [];
            const updateValues = [];
            if (username) {
                updateFields.push(`username = $${updateValues.length + 1}`);
                updateValues.push(username);
            }
            if (email) {
                updateFields.push(`email = $${updateValues.length + 1}`);
                updateValues.push(email);
            }

            // Append the user ID to values array
            updateValues.push(req.user.userId);

            // Update the user in the database
            const result = await pool.query(
                `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${
                    updateValues.length
                } RETURNING id, username, email`,
                updateValues
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json({
                message: "User updated successfully",
                userId: result.rows[0].id,
                username: result.rows[0].username,
                userEmail: result.rows[0].email,
            });
        } catch (err) {
            console.error("Error updating profile:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Delete User
app.delete("/profile", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM users WHERE id = $1 RETURNING id",
            [req.user.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Image Upload Route
app.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
        // Delete the uploaded file if invalid
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid file type" });
    }

    if (req.file.size > 5 * 1024 * 1024) {
        // Delete the uploaded file if too large
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "File size exceeds limit (5MB)" });
    }

    try {
        const result = await pool.query(
            "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id",
            [req.file.filename, req.user.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res
            .status(200)
            .json({ message: "Profile image updated successfully" });
    } catch (err) {
        console.error("Error uploading profile image:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Update user profile image
app.put(
    "/profile/image",
    verifyToken,
    upload.single("image"),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            // Begin transaction for safety
            await pool.query("BEGIN");

            // Get the current profile image filename
            const userResult = await pool.query(
                "SELECT profile_image FROM users WHERE id = $1",
                [req.user.userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const currentImage = userResult.rows[0].profile_image;

            // Update the user's profile image in the database
            const result = await pool.query(
                "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING profile_image",
                [req.file.filename, req.user.userId]
            );

            if (result.rows.length === 0) {
                throw new Error(
                    "Failed to update profile image in the database"
                );
            }

            // Delete the old image from the file system if it exists
            if (currentImage) {
                const oldImagePath = path.join(
                    __dirname,
                    "uploads",
                    currentImage
                );
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error("Error deleting old profile image:", err);
                    }
                });
            }

            // Commit the transaction
            await pool.query("COMMIT");

            return res.status(200).json({
                message: "Profile image updated successfully",
                profile_image_url: `/uploads/${req.file.filename}`,
            });
        } catch (err) {
            // Rollback on error
            await pool.query("ROLLBACK");
            console.error("Error updating profile image:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
