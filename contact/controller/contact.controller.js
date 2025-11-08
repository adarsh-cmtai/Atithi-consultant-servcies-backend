const contactService = require("../service/contact.service.js");

const submitInquiry = async (req, res) => {
    try {
        const inquiry = await contactService.createInquiry(req.body);
        res.status(201).json({
            message: "Your message has been sent successfully! We will get back to you shortly.",
            data: inquiry,
        });
    } catch (error) {
        console.error("Error submitting inquiry:", error);
        res.status(500).json({ message: "An error occurred while sending your message." });
    }
};

module.exports = { submitInquiry };