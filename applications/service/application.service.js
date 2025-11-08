const JobApplication = require("../../models/jobApplication.model.js");
const LoanApplication = require("../../models/loanApplication.model.js");

const createJobApplication = async (applicationData, userId, paymentDetails) => {
    try {
        const newApplication = new JobApplication({
            ...applicationData,
            userId,
            paymentDetails
        });
        const savedApplication = await newApplication.save();
        return savedApplication;
    } catch (error) {
        console.error("Error creating job application:", error);
        throw new Error("Could not save job application");
    }
};

const createLoanApplication = async (applicationData, userId, paymentDetails) => {
    try {
        const newApplication = new LoanApplication({
            ...applicationData,
            userId,
            paymentDetails
        });
        const savedApplication = await newApplication.save();
        return savedApplication;
    } catch (error) {
        console.error("Error creating loan application:", error);
        throw new Error("Could not save loan application");
    }
};

module.exports = { createJobApplication, createLoanApplication };