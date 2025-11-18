// --- START OF FILE applications/routes/application.routes.js ---

const express = require("express");
const { submitJobApplication, submitLoanApplication } = require("../controller/application.controller.js");
const { optionalAuth } = require("../../middlewares/optionalAuth.middleware.js");

const router = express.Router();

router.post("/job", optionalAuth, submitJobApplication);
router.post("/loan", optionalAuth, submitLoanApplication);

module.exports = router;