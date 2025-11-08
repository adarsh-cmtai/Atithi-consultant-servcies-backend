const express = require("express");
const { submitJobApplication, submitLoanApplication } = require("../controller/application.controller.js");
const { verifyJWT } = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.post("/job", verifyJWT, submitJobApplication);
router.post("/loan", verifyJWT, submitLoanApplication);

module.exports = router;