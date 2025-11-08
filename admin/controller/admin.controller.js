const adminService = require("../service/admin.service.js");

const getDashboard = async (req, res) => {
    try {
        const dashboardData = await adminService.getDashboardOverview();
        res.status(200).json({
            message: "Dashboard data fetched successfully",
            data: dashboardData
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: "An error occurred while fetching dashboard data." });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const analyticsData = await adminService.getAnalyticsData(req.query);
        res.status(200).json({
            message: "Analytics data fetched successfully",
            data: analyticsData,
        });
    } catch (error) {
        console.error("Error fetching analytics data:", error);
        res.status(500).json({ message: "An error occurred while fetching analytics data." });
    }
};

const getUsers = async (req, res) => {
    try {
        const result = await adminService.getAllUsers(req.query);
        res.status(200).json({
            message: "Users fetched successfully",
            data: result.users,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "An error occurred while fetching users." });
    }
};

const getJobApplications = async (req, res) => {
    try {
        const result = await adminService.getAllJobApplications(req.query);
        res.status(200).json({
            message: "Job applications fetched successfully",
            data: result.applications,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        res.status(500).json({ message: "An error occurred while fetching job applications." });
    }
};

const getLoanApplications = async (req, res) => {
    try {
        const result = await adminService.getAllLoanApplications(req.query);
        res.status(200).json({
            message: "Loan applications fetched successfully",
            data: result.applications,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error("Error fetching loan applications:", error);
        res.status(500).json({ message: "An error occurred while fetching loan applications." });
    }
};

const getSettings = async (req, res) => {
    try {
        const settings = await adminService.getWebsiteSettings();
        res.status(200).json({ message: "Settings fetched successfully", data: settings });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch settings." });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updatedSettings = await adminService.updateWebsiteSettings(req.body);
        res.status(200).json({ message: "Settings updated successfully", data: updatedSettings });
    } catch (error) {
        res.status(500).json({ message: "Failed to update settings." });
    }
};

const getAdminUsers = async (req, res) => {
    try {
        const admins = await adminService.getAllAdmins();
        res.status(200).json({ message: "Admin users fetched successfully", data: admins });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admin users." });
    }
};

const addAdminUser = async (req, res) => {
    try {
        const newAdmin = await adminService.createNewAdmin(req.body);
        res.status(201).json({ message: "Admin user created successfully", data: newAdmin });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

const getInquiries = async (req, res) => {
    try {
        const result = await adminService.getAllInquiries(req.query);
        res.status(200).json({
            message: "Inquiries fetched successfully",
            data: result.inquiries,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error("Error fetching inquiries:", error);
        res.status(500).json({ message: "An error occurred while fetching inquiries." });
    }
};

const replyToInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;
        const updatedInquiry = await adminService.replyToInquiryById(id, replyMessage, req.user);
        res.status(200).json({
            message: "Reply sent successfully",
            data: updatedInquiry,
        });
    } catch (error) {
        console.error("Error replying to inquiry:", error);
        res.status(500).json({ message: error.message || "An error occurred while sending the reply." });
    }
};

const getJobApplicationById = async (req, res) => {
    try {
        const application = await adminService.getApplicationByIdForAdmin("job", req.params.id);
        res.status(200).json({ data: application });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const getLoanApplicationById = async (req, res) => {
    try {
        const application = await adminService.getApplicationByIdForAdmin("loan", req.params.id);
        res.status(200).json({ data: application });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const updateJobApplicationStatus = async (req, res) => {
    try {
        const updatedApp = await adminService.updateStatusForApplication("job", req.params.id, req.body.status);
        res.status(200).json({ message: "Status updated successfully", data: updatedApp });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLoanApplicationStatus = async (req, res) => {
    try {
        const updatedApp = await adminService.updateStatusForApplication("loan", req.params.id, req.body.status);
        res.status(200).json({ message: "Status updated successfully", data: updatedApp });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const userDetails = await adminService.getUserDetails(req.params.id);
        res.status(200).json({ data: userDetails });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

const deleteUserById = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.status(200).json({ message: "User and their applications deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboard, getAnalytics, getUsers, getJobApplications, getLoanApplications,
    getSettings, updateSettings, getAdminUsers, addAdminUser, getInquiries, replyToInquiry,
    getJobApplicationById, getLoanApplicationById, updateJobApplicationStatus, updateLoanApplicationStatus,
    getUserById, deleteUserById
};