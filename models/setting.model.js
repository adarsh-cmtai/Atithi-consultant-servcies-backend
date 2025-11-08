const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: "Atithi Consultant Services"
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    applicationFee: {
        type: Number,
        default: 450
    }
}, { timestamps: true });

const Setting = mongoose.model("Setting", settingSchema);

module.exports = Setting;