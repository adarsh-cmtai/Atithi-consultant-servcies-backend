const { createJobApplication, createLoanApplication } = require("../service/application.service.js");

const submitJobApplication = async (req, res) => {
    try {
        const { applicationData, paymentDetails } = req.body;
        const userId = req.user._id;

        if (!applicationData.declaration || !applicationData.authorized) {
            return res.status(400).json({ message: "You must accept the declarations." });
        }
        if (!paymentDetails || !paymentDetails.paymentId) {
            return res.status(400).json({ message: "Payment details are missing or invalid." });
        }

        const newApplication = await createJobApplication(applicationData, userId, paymentDetails);
        res.status(201).json({
            message: "Job application submitted successfully",
            data: newApplication,
        });
    } catch (error) {
        console.error("Error in submitJobApplication controller:", error);
        res.status(500).json({ message: "An error occurred while submitting the application." });
    }
};

const submitLoanApplication = async (req, res) => {
    try {
        const { applicationData, paymentDetails } = req.body;
        const userId = req.user._id;

        if (!applicationData.declaration) {
            return res.status(400).json({ message: "You must accept the declaration." });
        }
        if (!paymentDetails || !paymentDetails.paymentId) {
            return res.status(400).json({ message: "Payment details are missing or invalid." });
        }

        const newApplication = await createLoanApplication(applicationData, userId, paymentDetails);
        res.status(201).json({
            message: "Loan application submitted successfully",
            data: newApplication,
        });
    } catch (error) {
        console.error("Error in submitLoanApplication controller:", error);
        res.status(500).json({ message: "An error occurred while submitting the application." });
    }
};

module.exports = { submitJobApplication, submitLoanApplication };