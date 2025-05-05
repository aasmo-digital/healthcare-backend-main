const { default: axios } = require("axios");
const User = require("../models/user.models");
const jwt = require("jsonwebtoken");

const wachat_api=process.env.WACHAT_API;
const wachat_token=process.env.WACHAT_TOKEN;


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

        // Generate OTP and expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        console.log(`Generated OTP for ${phone}: ${otp}`);

        // Save to DB
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // WhatsApp payload
        const payload = {
            token: wachat_token,
            phone: `91${phone}`,
            template_name: "otp_verification",
            template_language: "en",
            components: [
                {
                    type: "BODY",
                    parameters: [
                        {
                            type: "text",
                            text: otp
                        }
                    ]
                },
                {
                    type: "BUTTON",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                        {
                            type: "text",
                            text: otp
                        }
                    ]
                }
            ]
        };

        const whatsappRes = await axios.post(
            wachat_api,
            payload
        );

        console.log("WhatsApp API Response:", whatsappRes.data);

        res.status(200).json({
            message: "OTP sent successfully to WhatsApp",
            whatsappStatus: whatsappRes.data
        });

    } catch (error) {
        console.error("Error sending OTP:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    console.log("Request Body:", req.body);

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`Stored OTP: ${user.otp}, Received OTP: ${otp}`);

        // Check OTP match
        if (String(user.otp) !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check expiry
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Clear OTP after successful login
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role }, // using `id` instead of `userId`
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({ message: "Login successful", token, role: user.role });

    } catch (error) {
        console.error("OTP Verification Error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};



const getOwnProfile = async (req, res) => {
    try {
        const id = req.user.id;

        if (!id) {
            return res.status(400).json({ message: "User ID not found in token" });
        }

        // Fetch user details including full details of referred users
        const user = await User.findById(id)
            .select("-otp -otpExpires")
            .populate('city') // Populating city details
            .populate({
                path: 'referrals',
                select: 'fullName phone email city role createdAt', // Selecting only necessary fields
                populate: { path: 'city', select: 'name' } // Populating city inside referrals
            });

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
        const { fullName, phone, city, email } = req.body
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
const getReferredUsers = async (req, res) => {
    try {
        const userId = req.user.id; // Logged-in user ID

        if (!userId) {
            return res.status(400).json({ message: "User ID not found in token" });
        }

        // Find the logged-in user's referral code
        const user = await User.findById(userId).select("referralCode");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch all users who used this referral code
        const referredUsers = await User.find({ referrals: userId })
            .select("fullName phone email city role createdAt")
            .populate("city", "name");

        res.status(200).json({ message: "Fetched Successfully", data: referredUsers });
    } catch (error) {
        console.error("Error fetching referred users:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = { register, sendOtp, verifyOtp, getOwnProfile, getReferredUsers, getallUser, getbyIdUser, updateUser, deleteUser };
