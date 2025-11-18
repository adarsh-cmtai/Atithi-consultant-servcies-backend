const JobApplication = require("../../models/jobApplication.model.js");
const LoanApplication = require("../../models/loanApplication.model.js");
const { User } = require("../../models/user.model.js");
const Setting = require("../../models/setting.model.js");
const ContactInquiry = require("../../models/contactInquiry.model.js");
const Notification = require("../../models/notification.model.js");
const { sendEmail } = require("../../services/email.service.js");
const mongoose = require("mongoose");


const getDashboardOverview = async () => {
    const totalUsersPromise = User.countDocuments({ role: 'customer' });

    const totalApplicationsPromise = Promise.all([
        JobApplication.countDocuments(),
        LoanApplication.countDocuments()
    ]).then(([jobCount, loanCount]) => jobCount + loanCount);

    const pendingApplicationsPromise = Promise.all([
        JobApplication.countDocuments({ status: 'Pending' }),
        LoanApplication.countDocuments({ status: 'Pending' })
    ]).then(([jobCount, loanCount]) => jobCount + loanCount);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const approvedThisMonthPromise = Promise.all([
        JobApplication.countDocuments({ status: 'Approved', createdAt: { $gte: startOfMonth } }),
        LoanApplication.countDocuments({ status: 'Approved', createdAt: { $gte: startOfMonth } })
    ]).then(([jobCount, loanCount]) => jobCount + loanCount);

    const recentJobAppsPromise = JobApplication.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'fullName');
    const recentLoanAppsPromise = LoanApplication.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'fullName');

    const jobStatusPromise = JobApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const loanStatusPromise = LoanApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    
    const [
        totalUsers,
        totalApplications,
        pendingApplications,
        approvedThisMonth,
        recentJobApps,
        recentLoanApps,
        jobStatusDistribution,
        loanStatusDistribution
    ] = await Promise.all([
        totalUsersPromise,
        totalApplicationsPromise,
        pendingApplicationsPromise,
        approvedThisMonthPromise,
        recentJobAppsPromise,
        recentLoanAppsPromise,
        jobStatusPromise,
        loanStatusPromise
    ]);

    const combinedRecent = [...recentJobApps, ...recentLoanApps]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(app => ({
            id: app._id,
            name: app.userId ? app.userId.fullName : 'N/A',
            type: app.constructor.modelName === 'JobApplication' ? 'Job' : 'Loan',
            status: app.status,
            date: app.createdAt.toISOString().split('T')[0]
        }));
    
    const statusMap = new Map();
    [...jobStatusDistribution, ...loanStatusDistribution].forEach(item => {
        statusMap.set(item._id, (statusMap.get(item._id) || 0) + item.count);
    });
    const statusPieChartData = Array.from(statusMap, ([status, count]) => ({ status, count }));

    return {
        statsCards: [
            { title: "Total Users", value: totalUsers.toLocaleString() },
            { title: "Total Applications", value: totalApplications.toLocaleString() },
            { title: "Pending Applications", value: pendingApplications.toLocaleString(), isPrimary: true },
            { title: "Approved This Month", value: approvedThisMonth.toLocaleString() },
        ],
        recentApplications: combinedRecent,
        statusPieChartData
    };
};

const getAnalyticsData = async (queryParams) => {
    const { startDate, endDate } = queryParams;
    const dateFilter = {};
    if (startDate && endDate) {
        dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const totalUsersPromise = User.countDocuments();

    const successRatePipeline = [
        { $match: { ...dateFilter, status: { $in: ['Approved', 'Rejected'] } } },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } }
        }}
    ];

    const jobSuccessPromise = JobApplication.aggregate(successRatePipeline);
    const loanSuccessPromise = LoanApplication.aggregate(successRatePipeline);
    
    const totalApplicationsPromise = Promise.all([
        JobApplication.countDocuments(dateFilter),
        LoanApplication.countDocuments(dateFilter)
    ]).then(([jobCount, loanCount]) => jobCount + loanCount);

    const avgApprovalTimePipeline = [
        { $match: { ...dateFilter, status: 'Approved' } },
        { $project: { timeToApprove: { $dateDiff: { startDate: "$createdAt", endDate: "$updatedAt", unit: "day" } } } },
        { $group: { _id: null, avgTime: { $avg: "$timeToApprove" } } }
    ];

    const jobApprovalTimePromise = JobApplication.aggregate(avgApprovalTimePipeline);
    const loanApprovalTimePromise = LoanApplication.aggregate(avgApprovalTimePipeline);

    const volumeChartPipeline = (model) => [
        { $match: dateFilter },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ];

    const jobVolumePromise = JobApplication.aggregate(volumeChartPipeline(JobApplication));
    const loanVolumePromise = LoanApplication.aggregate(volumeChartPipeline(LoanApplication));
    
    const topJobsPromise = JobApplication.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$position", applications: { $sum: 1 } } },
        { $sort: { applications: -1 } },
        { $limit: 5 },
        { $project: { position: "$_id", applications: 1, _id: 0 } }
    ]);
    
    const [
        totalUsers,
        jobSuccess,
        loanSuccess,
        totalApplications,
        jobApprovalTime,
        loanApprovalTime,
        jobVolume,
        loanVolume,
        topJobsData
    ] = await Promise.all([
        totalUsersPromise,
        jobSuccessPromise,
        loanSuccessPromise,
        totalApplicationsPromise,
        jobApprovalTimePromise,
        loanApprovalTimePromise,
        jobVolumePromise,
        loanVolumePromise,
        topJobsPromise
    ]);

    const totalApproved = (jobSuccess[0]?.approved || 0) + (loanSuccess[0]?.approved || 0);
    const totalFinished = (jobSuccess[0]?.total || 0) + (loanSuccess[0]?.total || 0);
    const overallSuccessRate = totalFinished > 0 ? (totalApproved / totalFinished) * 100 : 0;

    const avgJobTime = jobApprovalTime[0]?.avgTime || 0;
    const avgLoanTime = loanApprovalTime[0]?.avgTime || 0;
    const totalApprovedCount = (jobApprovalTime.length > 0 ? 1 : 0) + (loanApprovalTime.length > 0 ? 1 : 0);
    const avgApprovalTime = totalApprovedCount > 0 ? (avgJobTime + avgLoanTime) / totalApprovedCount : 0;

    const volumeDataMap = new Map();
    jobVolume.forEach(item => volumeDataMap.set(item._id, { date: item._id, Job: item.count, Loan: 0 }));
    loanVolume.forEach(item => {
        if (volumeDataMap.has(item._id)) {
            volumeDataMap.get(item._id).Loan = item.count;
        } else {
            volumeDataMap.set(item._id, { date: item._id, Job: 0, Loan: item.count });
        }
    });
    const areaChartData = Array.from(volumeDataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
        kpiData: [
            { title: "Overall Success Rate", value: `${overallSuccessRate.toFixed(1)}%` },
            { title: "Avg. Approval Time", value: `${avgApprovalTime.toFixed(1)} Days` },
            { title: "Total Applications (Period)", value: totalApplications.toLocaleString() },
            { title: "Total Registered Users", value: totalUsers.toLocaleString() },
        ],
        areaChartData,
        topJobsData,
    };
};


const getWebsiteSettings = async () => {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = await new Setting().save();
    }
    return settings;
};

const updateWebsiteSettings = async (updateData) => {
    const settings = await Setting.findOneAndUpdate({}, updateData, { new: true, upsert: true });
    return settings;
};

const getAllAdmins = async () => {
    return await User.find({ role: { $in: ['Admin', 'Super Admin'] } }).select("-password");
};

const createNewAdmin = async (adminData) => {
    const { fullName, email, password, role } = adminData;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("An account with this email already exists.");
    }
    const newUser = new User({
        fullName,
        email,
        password,
        role,
        phoneNumber: "0000000000",
        isEmailVerified: true,
    });
    await newUser.save();
    const createdUser = await User.findById(newUser._id).select("-password");
    return createdUser;
};


const getAllUsers = async (queryParams) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = queryParams;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const matchStage = {};
    if (search) {
        matchStage.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    
    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "jobapplications",
                localField: "_id",
                foreignField: "userId",
                as: "jobApps"
            }
        },
        {
            $lookup: {
                from: "loanapplications",
                localField: "_id",
                foreignField: "userId",
                as: "loanApps"
            }
        },
        {
            $addFields: {
                applicationCount: { $add: [{ $size: "$jobApps" }, { $size: "$loanApps" }] }
            }
        },
    ];

    const usersPromise = User.aggregate([
        ...pipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $project: {
                _id: 1,
                name: "$fullName",
                email: 1,
                avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
                registrationDate: "$createdAt",
                applicationCount: 1,
                status: "Active",
            }
        }
    ]);

    const countPipeline = [...pipeline, { $count: "totalDocuments" }];
    const totalDocumentsPromise = User.aggregate(countPipeline);

    const [users, totalResult] = await Promise.all([usersPromise, totalDocumentsPromise]);
    
    const totalDocuments = totalResult.length > 0 ? totalResult[0].totalDocuments : 0;
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
        users,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalDocuments,
        }
    };
};

const getAllJobApplications = async (queryParams) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, search } = queryParams;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const matchStage = {};
    if (status) {
        matchStage.status = status;
    }
    let pipeline = [
        { $match: matchStage },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "applicant" } },
        { $unwind: "$applicant" },
    ];
    if (search) {
        pipeline.push({ $match: { "applicant.fullName": { $regex: search, $options: 'i' } } });
    }
    const applicationsPromise = JobApplication.aggregate([
        ...pipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $project: { _id: 1, applicantName: "$applicant.fullName", position: 1, submissionDate: "$createdAt", status: 1, assignedTo: "Admin" } }
    ]);
    const countPipeline = [...pipeline, { $count: "totalDocuments" }];
    const totalDocumentsPromise = JobApplication.aggregate(countPipeline);
    const [applications, totalResult] = await Promise.all([applicationsPromise, totalDocumentsPromise]);
    const totalDocuments = totalResult.length > 0 ? totalResult[0].totalDocuments : 0;
    const totalPages = Math.ceil(totalDocuments / limit);
    return {
        applications,
        pagination: { currentPage: parseInt(page), totalPages, totalDocuments }
    };
};

const getAllLoanApplications = async (queryParams) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, search } = queryParams;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const matchStage = {};
    if (status) {
        matchStage.status = status;
    }
    let pipeline = [
        { $match: matchStage },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "applicant" } },
        { $unwind: "$applicant" },
    ];
    if (search) {
        pipeline.push({ $match: { "applicant.fullName": { $regex: search, $options: 'i' } } });
    }
    const applicationsPromise = LoanApplication.aggregate([
        ...pipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $project: { _id: 1, applicantName: "$applicant.fullName", loanAmount: 1, loanPurpose: 1, submissionDate: "$createdAt", status: 1, assignedTo: "Admin" } }
    ]);
    const countPipeline = [...pipeline, { $count: "totalDocuments" }];
    const totalDocumentsPromise = LoanApplication.aggregate(countPipeline);
    const [applications, totalResult] = await Promise.all([applicationsPromise, totalDocumentsPromise]);
    const totalDocuments = totalResult.length > 0 ? totalResult[0].totalDocuments : 0;
    const totalPages = Math.ceil(totalDocuments / limit);
    return {
        applications,
        pagination: { currentPage: parseInt(page), totalPages, totalDocuments }
    };
};

const getAllInquiries = async (queryParams) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = queryParams;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } }
        ];
    }
    
    const inquiriesPromise = ContactInquiry.find(filter).sort(sort).skip(skip).limit(parseInt(limit));
    const totalDocumentsPromise = ContactInquiry.countDocuments(filter);

    const [inquiries, totalDocuments] = await Promise.all([inquiriesPromise, totalDocumentsPromise]);
    
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
        inquiries,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalDocuments,
        }
    };
};

const replyToInquiryById = async (inquiryId, replyMessage, adminUser) => {
    const inquiry = await ContactInquiry.findById(inquiryId);
    if (!inquiry) {
        throw new Error("Inquiry not found.");
    }

    const subject = `Re: Your Inquiry - ${inquiry.subject}`;
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>Hello ${inquiry.name},</h3>
            <p>Thank you for contacting Atithi Consultant Services. Here is the response to your inquiry:</p>
            <div style="padding: 15px; border-left: 4px solid #0047ab; background-color: #f0f4f8; margin: 20px 0;">
                <p style="margin: 0;">${replyMessage}</p>
            </div>
            <p>If you have any further questions, please feel free to reply to this email.</p>
            <br>
            <p>Best Regards,</p>
            <p><strong>${adminUser.fullName}</strong></p>
            <p>Atithi Consultant Services Team</p>
            <hr>
            <p style="font-size: 0.9em; color: #777;">
                <strong>Original Message from you:</strong><br>
                <em>"${inquiry.message}"</em>
            </p>
        </div>
    `;

    await sendEmail(inquiry.email, subject, emailHtml);

    inquiry.status = 'Replied';
    await inquiry.save();
    
    return inquiry;
};

const getApplicationByIdForAdmin = async (type, appId) => {
    const model = type === 'job' ? JobApplication : LoanApplication;
    const application = await model.findById(appId).populate('userId', 'fullName email');
    if (!application) {
        throw new Error("Application not found.");
    }
    return application;
};

const updateStatusForApplication = async (type, appId, newStatus) => {
    const model = type === 'job' ? JobApplication : LoanApplication;
    const application = await model.findById(appId);

    if (!application) {
        throw new Error("Application not found.");
    }

    application.status = newStatus;
    await application.save();

    const appTitle = type === 'job' ? application.position : application.loanPurpose;
    const notificationText = `Your ${type} application for '${appTitle}' has been updated to '${newStatus}'.`;

    await Notification.create({
        userId: application.userId,
        type: 'update',
        text: notificationText,
        link: `/customer/applications`
    });

    return application;
};

const getUserDetails = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new Error("User not found.");
    }
    const jobApps = await JobApplication.find({ userId: userId }).sort({ createdAt: -1 });
    const loanApps = await LoanApplication.find({ userId: userId }).sort({ createdAt: -1 });
    return { user, jobApps, loanApps };
};

const deleteUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found.");
    }
    await JobApplication.deleteMany({ userId: userId });
    await LoanApplication.deleteMany({ userId: userId });
    await User.findByIdAndDelete(userId);
    return true;
};

const exportAllJobApplications = async () => {
    const applications = await JobApplication.find({})
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();
    
    return applications;
};

const exportAllLoanApplications = async () => {
    const applications = await LoanApplication.find({})
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();
    
    return applications;
};

module.exports = {
    getDashboardOverview, getAnalyticsData, getAllJobApplications, getAllLoanApplications, 
    getWebsiteSettings, updateWebsiteSettings, getAllAdmins, createNewAdmin, getAllUsers,
    getAllInquiries, replyToInquiryById, getApplicationByIdForAdmin, updateStatusForApplication,
    getUserDetails, deleteUser, exportAllJobApplications, exportAllLoanApplications,
};