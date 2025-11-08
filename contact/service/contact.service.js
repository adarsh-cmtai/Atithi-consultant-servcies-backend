const ContactInquiry = require("../../models/contactInquiry.model.js");
const { sendEmail } = require("../../services/email.service.js");

const createInquiry = async (inquiryData) => {
    const newInquiry = new ContactInquiry(inquiryData);
    await newInquiry.save();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
        const subject = `New Contact Inquiry: ${newInquiry.subject}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>New Contact Inquiry Received</h2>
                <p>You have received a new message from the website contact form.</p>
                <hr>
                <p><strong>Name:</strong> ${newInquiry.name}</p>
                <p><strong>Email:</strong> ${newInquiry.email}</p>
                <p><strong>Phone:</strong> ${newInquiry.phone}</p>
                <p><strong>Subject:</strong> ${newInquiry.subject}</p>
                <p><strong>Message:</strong></p>
                <p style="padding: 10px; border-left: 3px solid #eee;">${newInquiry.message}</p>
                <hr>
                <p>You can reply to this inquiry from the admin dashboard.</p>
            </div>
        `;
        try {
            await sendEmail(adminEmail, subject, emailHtml);
        } catch (error) {
            console.error("Failed to send inquiry notification email to admin:", error);
        }
    }
    
    return newInquiry;
};

module.exports = { createInquiry };