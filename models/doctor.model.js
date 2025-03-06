const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const doctorSchema = new mongoose.Schema(
    {
        doctorName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        specialization: {
            type: String,
            required: true
        },
        image: {
            type: String
        },
        hospitals: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },
        address: {
            type: String
        },
        experience: {
            type: String
        },
        clients: {
            type: String
        },
        about: {
            type: String
        },
        referralCode: {
            type: String,
            unique: true
        },
        role: {
            type: String,
            default: "doctor"
        },
        commission: { type: Number, default: 0 },
        referrals: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User" // List of users who used this doctor's referral code
            }
        ]
    },
    { timestamps: true }
);

// Function to generate a **random 6-digit** referral code
const generateReferralCode = async () => {
    let newCode;
    let isUnique = false;
    while (!isUnique) {
        newCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random number
        const existingDoctor = await mongoose.model("Doctor").findOne({ referralCode: newCode });
        if (!existingDoctor) isUnique = true;
    }
    return newCode;
};

// Middleware to auto-generate a **6-digit referralCode** & hash password before saving
doctorSchema.pre("save", async function (next) {
    if (!this.referralCode) {
        this.referralCode = await generateReferralCode();
    }

    // Hash password before saving
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
});

module.exports = mongoose.model("Doctor", doctorSchema);
