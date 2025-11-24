// --- START OF FILE applications/service/application.service.js ---

const JobApplication = require("../../models/jobApplication.model.js");
const LoanApplication = require("../../models/loanApplication.model.js");
const { sendEmail } = require("../../services/email.service.js");

const createJobApplication = async (applicationData, userId, paymentDetails) => {
    try {
        const newApplication = new JobApplication({
            ...applicationData,
            userId,
            paymentDetails
        });
        const savedApplication = await newApplication.save();

        const applicationID = savedApplication._id.toString().slice(-8).toUpperCase();

        const userEmail = savedApplication.email;
        const userName = savedApplication.fullName;
        const userSubject = `Application Received: ${savedApplication.position} (ID: ${applicationID})`;
        const userEmailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0047ab;">Thank you for your application, ${userName}!</h2>
                <p>We have successfully received your job application for the position of <strong>${savedApplication.position}</strong>.</p>
                <p>Our team will review your profile and get back to you shortly. You can use the Application ID below for any future correspondence.</p>
                <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Your Application Details:</h3>
                    <p><strong>Application ID:</strong> ${applicationID}</p>
                    <p><strong>Position Applied For:</strong> ${savedApplication.position}</p>
                    <p><strong>Submission Date:</strong> ${new Date(savedApplication.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <p>Best Regards,</p>
                <p><strong>Atithi Consultant Services Team</strong></p>
            </div>
        `;

        try {
            await sendEmail(userEmail, userSubject, userEmailHtml);
        } catch (error) {
            console.error(`Failed to send confirmation email to user ${userEmail}:`, error);
        }

        if (!userId) {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                const subject = `New Guest Job Application: ${savedApplication.position}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>New Job Application Received (Guest)</h2>
                        <p>A new job application has been submitted by a guest user.</p>
                        <hr>
                        <p><strong>Applicant Name:</strong> ${savedApplication.fullName}</p>
                        <p><strong>Email:</strong> ${savedApplication.email}</p>
                        <p><strong>Phone:</strong> ${savedApplication.phone}</p>
                        <p><strong>Position Applied For:</strong> ${savedApplication.position}</p>
                        <hr>
                        <p>You can view the full details in the admin dashboard.</p>
                    </div>
                `;
                try {
                    await sendEmail(adminEmail, subject, emailHtml);
                } catch (error) {
                    console.error("Failed to send guest application notification to admin:", error);
                }
            }
        }
        
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
        
        const applicationID = savedApplication._id.toString().slice(-8).toUpperCase();

        const userEmail = savedApplication.email;
        const userName = savedApplication.fullName;
        const userSubject = `Loan Application Received: ${savedApplication.loanPurpose} (ID: ${applicationID})`;
        const userEmailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0047ab;">Thank you for your application, ${userName}!</h2>
                <p>We have successfully received your loan application for <strong>${savedApplication.loanPurpose}</strong>.</p>
                <p>Our team will review your details and get back to you shortly. You can use the Application ID below for any future correspondence.</p>
                <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Your Application Details:</h3>
                    <p><strong>Application ID:</strong> ${applicationID}</p>
                    <p><strong>Loan Purpose:</strong> ${savedApplication.loanPurpose}</p>
                    <p><strong>Loan Amount:</strong> ${savedApplication.loanAmount}</p>
                    <p><strong>Submission Date:</strong> ${new Date(savedApplication.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <p>Best Regards,</p>
                <p><strong>Atithi Consultant Services Team</strong></p>
            </div>
        `;

        try {
            await sendEmail(userEmail, userSubject, userEmailHtml);
        } catch (error) {
            console.error(`Failed to send confirmation email to user ${userEmail}:`, error);
        }

        if (!userId) {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                const subject = `New Guest Loan Application: ${savedApplication.loanPurpose}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>New Loan Application Received (Guest)</h2>
                        <p>A new loan application has been submitted by a guest user.</p>
                        <hr>
                        <p><strong>Applicant Name:</strong> ${savedApplication.fullName}</p>
                        <p><strong>Email:</strong> ${savedApplication.email}</p>
                        <p><strong>Phone:</strong> ${savedApplication.contact}</p>
                        <p><strong>Loan Amount:</strong> ${savedApplication.loanAmount}</p>
                        <p><strong>Loan Purpose:</strong> ${savedApplication.loanPurpose}</p>
                        <hr>
                        <p>You can view the full details in the admin dashboard.</p>
                    </div>
                `;
                try {
                    await sendEmail(adminEmail, subject, emailHtml);
                } catch (error) {
                    console.error("Failed to send guest loan application notification to admin:", error);
                }
            }
        }

        return savedApplication;
    } catch (error) {
        console.error("Error creating loan application:", error);
        throw new Error("Could not save loan application");
    }
};

module.exports = { createJobApplication, createLoanApplication };