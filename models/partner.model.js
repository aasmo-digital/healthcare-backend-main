const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    otp: {
        type: String,
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: "partner"
    },
    referralCode: {
        type: String,
        unique: true
    },
    isAccountDetails:{
       type:Boolean,
      
       default:false
    },
    commission: { type: Number, default: 0 },
    referrals: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
}, { timestamps: true });

// Function to generate a random 6-digit referral code
partnerSchema.pre("save", function (next) {
    if (!this.referralCode) {
        this.referralCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    next();
});

module.exports = mongoose.model('Partner', partnerSchema);
