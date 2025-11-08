const customerService = require("../service/customer.service.js");

const getMyApplications = async (req, res) => {
    try {
        const applications = await customerService.getAllApplicationsForUser(req.user._id);
        res.status(200).json({
            message: "Applications fetched successfully",
            data: applications,
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "An error occurred while fetching applications." });
    }
};

const getDashboardOverview = async (req, res) => {
    try {
        const dashboardData = await customerService.getDashboardData(req.user._id);
        res.status(200).json({
            message: "Dashboard data fetched successfully",
            data: dashboardData,
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "An error occurred while fetching dashboard data." });
    }
};

const getProfile = async (req, res) => {
    try {
        const userProfile = await customerService.getUserProfile(req.user._id);
        res.status(200).json({ message: "User profile fetched successfully", data: userProfile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, address } = req.body;
        const updatedProfile = await customerService.updateUserProfile(req.user._id, { fullName, phone, address });
        res.status(200).json({ message: "Profile updated successfully", data: updatedProfile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: "Current and new passwords are required." });
        await customerService.changeUserPassword(req.user._id, currentPassword, newPassword);
        res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        res.status(error.message === "Incorrect current password" ? 401 : 500).json({ message: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const notifications = await customerService.getNotificationsForUser(req.user._id);
        res.status(200).json({ message: "Notifications fetched successfully", data: notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const updatedNotification = await customerService.markNotificationAsRead(req.params.id, req.user._id);
        res.status(200).json({ message: "Notification marked as read", data: updatedNotification });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const result = await customerService.markAllNotificationsAsRead(req.user._id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const result = await customerService.deleteNotificationForUser(req.params.id, req.user._id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};
const getApplicationById = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user._id;
        const application = await customerService.getApplicationDetails(userId, type, id);
        res.status(200).json({
            message: "Application details fetched successfully",
            data: application,
        });
    } catch (error) {
        res.status(error.message === "Not found or unauthorized" ? 404 : 500).json({ message: error.message });
    }
};


module.exports = {
    getMyApplications,
    getApplicationById,
    getDashboardOverview,
    getProfile,
    updateProfile,
    changePassword,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};