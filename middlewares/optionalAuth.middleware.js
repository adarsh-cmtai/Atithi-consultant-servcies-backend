// --- START OF FILE middlewares/optionalAuth.middleware.js ---

const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model.js");

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (token) {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decodedToken.id).select("-password");
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = { optionalAuth };