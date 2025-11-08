const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model.js");

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "Unauthorized request" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Invalid access token" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid access token" });
    }
};

module.exports = { verifyJWT };