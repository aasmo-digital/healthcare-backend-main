const { default: axios } = require("axios");
const User = require("../models/user.models");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    const { fullName, phone, city, email } = req.body;
    if (!fullName || !phone || !city || !email) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    try {
        let user = await User.findOne({ $or: [{ email }, { phone }] });
        if (user) {
            return res.status(400).json({ message: 'User with this email or phone already exists', errorCode: 'USER_EXISTS' });
        }

        user = new User({ fullName, phone, email, city });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Server error during user registration:", error.message);
        res.status(500).json({ message: 'Server error occurred. Please try again later.', errorCode: 'SERVER_ERROR' });
    }
};

const sendOtp = async (req, res) => {
    const { phone } = req.body;

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a 6-digit random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

        // Save OTP in the user document
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Print OTP in console instead of sending via SMS
        console.log(`Generated OTP for ${phone}: ${otp}`);

        res.status(200).json({ message: `${"OTP generated successfully "} ${"OTP"}: ${otp}` });

    } catch (error) {
        console.error("OTP Send Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    console.log("Request Body:", req.body); // Debugging

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`Stored OTP: ${user.otp}, Received OTP: ${otp}`);

        // Ensure OTP comparison is correct
        if (String(user.otp) !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Ensure OTP expiry check is working
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate JWT token with `id` instead of `userId`
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Changed userId to id
            process.env.JWT_SECRET
        );

        return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("OTP Verification Error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getOwnProfile = async (req, res) => {
    try {
        // Ensure user ID is extracted correctly from the authenticated request
        const id = req.user.id;

        if (!id) {
            return res.status(400).json({ message: "User ID not found in token" });
        }

        // Fetch user details excluding OTP fields
        const user = await User.findById(id).select("-otp -otpExpires").populate('city');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Fetched Successfully", data: user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getallUser = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }
        const skip = (page - 1) * limit;
        
        // Fetch users with city details
        const users = await User.find(query)
            .populate("city") // <-- Populating city details
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        // Get total user count
        const totalUsers = await User.countDocuments(query);

        res.status(200).json({ 
            message: "Fetched Successfully", 
            totalUsers, 
            totalPages: Math.ceil(totalUsers / limit), 
            currentPage: parseInt(page), 
            users 
        });
    } 
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const getbyIdUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate('city')
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Fetched Successfully", user });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}

const updateUser = async (req, res) => {
    try {
        const {fullName, phone, city, email}=req.body
       const user = await User.findByIdAndUpdate(req.params.id, { fullName, phone, city, email }, { new: true });
               if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "Fetched Successfully", user });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}


const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Fetched Successfully", user });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}

module.exports = { register, sendOtp, verifyOtp, getOwnProfile, getallUser ,getbyIdUser,updateUser,deleteUser};
