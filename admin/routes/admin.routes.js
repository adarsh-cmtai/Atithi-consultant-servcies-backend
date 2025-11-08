const express = require("express");
const {
    getDashboard, getAnalytics, getUsers, getJobApplications, getLoanApplications,
    getSettings, updateSettings, getAdminUsers, addAdminUser, getInquiries, replyToInquiry,
    getJobApplicationById, getLoanApplicationById, updateJobApplicationStatus, updateLoanApplicationStatus,
    getUserById, deleteUserById,
} = require("../controller/admin.controller.js");
const { verifyJWT } = require("../../middlewares/auth.middleware.js");
const { isAdmin } = require("../../middlewares/isAdmin.middleware.js");

const router = express.Router();

router.use(verifyJWT, isAdmin);

router.route("/dashboard").get(getDashboard);
router.route("/analytics").get(getAnalytics);

router.route("/users").get(getUsers);
router.route("/users/:id").get(getUserById).delete(deleteUserById);

router.route("/job-applications").get(getJobApplications);
router.route("/job-applications/:id").get(getJobApplicationById);
router.route("/job-applications/:id/status").patch(updateJobApplicationStatus);

router.route("/loan-applications").get(getLoanApplications);
router.route("/loan-applications/:id").get(getLoanApplicationById);
router.route("/loan-applications/:id/status").patch(updateLoanApplicationStatus);

router.route("/inquiries").get(getInquiries);
router.route("/inquiries/:id/reply").post(replyToInquiry);

router.route("/settings/website").get(getSettings).put(updateSettings);
router.route("/settings/admins").get(getAdminUsers).post(addAdminUser);

module.exports = router;