const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const { connectDB } = require("./config/db.js");

const authRouter = require("./auth/routes/auth.routes.js");
const applicationRouter = require("./applications/routes/application.routes.js");
const customerRouter = require("./customer/routes/customer.routes.js");
const adminRouter = require("./admin/routes/admin.routes.js");
const contactRouter = require("./contact/routes/contact.routes.js"); 
const paymentRouter = require("./payment/routes/payment.routes.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);
app.use("/api/payment", paymentRouter);

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is healthy" });
});

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server is running successfully at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed! Server not started.", err);
        process.exit(1);
    });