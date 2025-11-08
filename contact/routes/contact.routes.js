const express = require("express");
const { submitInquiry } = require("../controller/contact.controller.js");

const router = express.Router();

router.route("/").post(submitInquiry);

module.exports = router;