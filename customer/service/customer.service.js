const { User } = require("../../models/user.model.js");
const JobApplication = require("../../models/jobApplication.model.js");
const LoanApplication = require("../../models/loanApplication.model.js");
const Notification = require("../../models/notification.model.js");
const mongoose = require("mongoose");

const getAllApplicationsForUser = async (userId) => {
    const jobAppsPromise = JobApplication.find({ userId }).lean();
    const loanAppsPromise = LoanApplication.find({ userId }).lean();

    const [jobApps, loanApps] = await Promise.all([jobAppsPromise, loanAppsPromise]);

    const allApplications = [
        ...jobApps.map(app => ({ ...app, type: 'Job', title: app.position, submittedDate: app.createdAt })),
        ...loanApps.map(app => ({ ...app, type: 'Loan', title: app.loanPurpose, submittedDate: app.createdAt }))
    ];

    allApplications.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

    return allApplications;
};

const getDashboardData = async (userId) => {
    const userPromise = User.findById(userId).select("fullName").lean();
    const jobStatsPromise = JobApplication.aggregate([ { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['Pending', 'In Review', 'Requires Action'] } } }, { $sort: { createdAt: -1 } }, { $group: { _id: null, count: { $sum: 1 }, latestStatus: { $first: "$status" } } } ]);
    const loanStatsPromise = LoanApplication.aggregate([ { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $in: ['Pending', 'In Review', 'Requires Action'] } } }, { $sort: { createdAt: -1 } }, { $group: { _id: null, count: { $sum: 1 }, latestStatus: { $first: "$status" } } } ]);
    const recentActivitiesPromise = Notification.find({ userId }).sort({ createdAt: -1 }).limit(3).lean();
    const [user, jobStatsResult, loanStatsResult, recentActivities] = await Promise.all([ userPromise, jobStatsPromise, loanStatsPromise, recentActivitiesPromise ]);
    const jobStats = jobStatsResult[0] || { count: 0, latestStatus: "No Active Applications" };
    const loanStats = loanStatsResult[0] || { count: 0, latestStatus: "No Active Applications" };
    return { user, jobStats, loanStats, recentActivities };
};

const getUserProfile = async (userId) => {
    const user = await User.findById(userId).select("-password -forgotPasswordToken -forgotPasswordTokenExpiry");
    if (!user) throw new Error("User not found");
    return user;
};

const updateUserProfile = async (userId, updateData) => {
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select("-password");
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
};

const changeUserPassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new Error("Incorrect current password");
    user.password = newPassword;
    await user.save();
};

const getNotificationsForUser = async (userId) => {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
};

const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate({ _id: notificationId, userId: userId }, { read: true }, { new: true });
    if (!notification) throw new Error("Notification not found or you do not have permission.");
    return notification;
};

const markAllNotificationsAsRead = async (userId) => {
    await Notification.updateMany({ userId: userId, read: false }, { $set: { read: true } });
    return { message: "All notifications marked as read." };
};

const deleteNotificationForUser = async (notificationId, userId) => {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId: userId });
    if (!result) throw new Error("Notification not found or you do not have permission.");
    return { message: "Notification deleted successfully." };
};

const getApplicationDetails = async (userId, type, appId) => {
    let application;
    const model = type === 'job' ? JobApplication : LoanApplication;

    if (!mongoose.Types.ObjectId.isValid(appId)) {
        throw new Error("Invalid application ID.");
    }

    application = await model.findOne({ _id: appId, userId: userId });

    if (!application) {
        throw new Error("Not found or unauthorized");
    }

    return application;
};

module.exports = {
    getAllApplicationsForUser,
    getApplicationDetails,
    getDashboardData,
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationForUser,
};