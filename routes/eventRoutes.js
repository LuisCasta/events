const express = require("express");
const router = express.Router();
const flightController = require("../controllers/flightController");
// const authMiddleware = require("../middlewares/authMiddleware");


router.post("/confirm", flightController.confirm);


module.exports = router;
