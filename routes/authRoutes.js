const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// const authMiddleware = require("../middlewares/authMiddleware");


router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/update-password", authController.updatePassword);


module.exports = router;
