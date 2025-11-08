const express = require("express");
const { 
    getMyApplications,
    getApplicationById,
    getDashboardOverview,
    getProfile, 
    updateProfile, 
    changePassword,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controller/customer.controller.js");
const { verifyJWT } = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(verifyJWT);

router.route("/applications").get(getMyApplications);
router.route("/applications/:type/:id").get(getApplicationById);

router.route("/dashboard").get(getDashboardOverview);
router.route("/profile").get(getProfile).put(updateProfile);
router.route("/change-password").patch(changePassword);
router.route("/notifications").get(getNotifications);
router.route("/notifications/mark-all-read").patch(markAllAsRead);
router.route("/notifications/:id/read").patch(markAsRead);
router.route("/notifications/:id").delete(deleteNotification);

module.exports = router;