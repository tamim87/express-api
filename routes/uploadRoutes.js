const express = require("express");
const { UploadImage } = require("../controllers/uploadController");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../middleware/multer");

const router = express.Router();

// Upload user image
router.post("/upload", verifyToken, upload.single("image"), UploadImage);

module.exports = router;
