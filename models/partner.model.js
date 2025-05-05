const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        set: function (value) {
            if (typeof value === 'string' && !value.startsWith('91')) {
                return '91' + value;
            }
            return value;
        },
        validate: {
            validator: function (v) {
                return /^91\d{10}$/.test(v); // 91 followed by exactly 10 digits
            },
            message: props => `${props.value} is not a valid phone number! It must start with 91 and be 12 digits.`
        }
    },
    otp: {
        type: String,
    },
    otpExpires: Date,
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
    isAccountDetails: {
        type: Boolean,

        default: false
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
