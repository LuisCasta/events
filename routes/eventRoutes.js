const express = require("express");
const router = express.Router();
const flightController = require("../controllers/flightController");


router.post("/confirm", flightController.confirm);
router.post("/confirmOrDecline", flightController.confirmOrDecline);
router.post("/getInvitationData", flightController.getInvitationData);
router.get("/getUsers", flightController.getRecords);
router.get("/getUsersConfirmed", flightController.getRecordsConfirmed);

module.exports = router;
