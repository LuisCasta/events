const express = require("express");
const router = express.Router();
const flightController = require("../controllers/flightController");


router.post("/confirm", flightController.confirm);
router.post("/confirmOrDecline", flightController.confirmOrDecline);
router.post("/getInvitationData", flightController.getInvitationData);

module.exports = router;
