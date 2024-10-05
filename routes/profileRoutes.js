const express = require("express");
const {
    getProfile,
    updateProfile,
    deleteProfile,
    uppdateProfileImage,
} = require("../controllers/profileController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Get User Profile
router.get("/profile", verifyToken, getProfile);

// Update User Profile
router.put("/profile", verifyToken, updateProfile);

// Delete User Profile
router.delete("/profile", verifyToken, deleteProfile);

// Update User Profile Image
router.put("/profile/image", verifyToken, uppdateProfileImage);

module.exports = router;
