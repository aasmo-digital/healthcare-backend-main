const { default: axios } = require("axios");
const Partner = require("../models/partner.model");
const User = require("../models/user.models");
const jwt = require("jsonwebtoken");
const BookApp = require('../models/bookApp.model');

const wachat_api=process.env.WACHAT_API;
const wachat_token=process.env.WACHAT_TOKEN;

const register = async (req, res) => {
    const { fullName, phone, city, email } = req.body;
    if (!fullName || !phone || !city || !email) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    try {
        let partner = await Partner.findOne({ $or: [{ email }, { phone }] });
        if (partner) {
            return res.status(400).json({ message: 'Partner with this email or phone already exists', errorCode: 'PARTNER_EXISTS' });
        }

        partner = new Partner({ fullName, phone, email, city });
        await partner.save();
        res.status(201).json({ message: 'Partner registered successfully' });
    } catch (error) {
        console.error("Server error during partner registration:", error.message);
        res.status(500).json({ message: 'Server error occurred. Please try again later.', errorCode: 'SERVER_ERROR' });
    }
};

const sendOtp = async (req, res) => {
    const { phone } = req.body;

    try {
        const partner = await Partner.findOne({ phone });
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }

        // Generate OTP and expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        console.log(`Generated OTP for ${phone}: ${otp}`);

        // Save to DB
        partner.otp = otp;
        partner.otpExpires = otpExpires;
        await partner.save();

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
        const partner = await Partner.findOne({ phone });
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }

        console.log(`Stored OTP: ${partner.otp}, Received OTP: ${otp}`);

        // Check OTP match
        if (String(partner.otp) !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Check expiry
        if (partner.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Clear OTP after successful login
        partner.otp = undefined;
        partner.otpExpires = undefined;
        await partner.save();

        // Generate JWT Token
        const token = jwt.sign(
            { id: partner._id, role: partner.role }, // using `id` instead of `userId`
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({ message: "Login successful", token, role: partner.role });

    } catch (error) {
        console.error("OTP Verification Error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getOwnProfile = async (req, res) => {
    try {
        const id = req.user.id;

        if (!id) {
            return res.status(400).json({ message: "Partner ID not found in token" });
        }

    
        const partner = await Partner.findById(id)
            .select("-otp -otpExpires")
            .populate('city') // Populating city details
            .populate({
                path: 'referrals', 
                select: 'fullName phone email city role createdAt', // Selecting only necessary fields
                populate: { path: 'city', select: 'name' } // Populating city inside referrals
            });

        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }

        res.status(200).json({ message: "Fetched Successfully", data: partner });
    } catch (error) {
        console.error("Error fetching partner profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const getallPartner = async (req, res) => {
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
        
        // Fetch partners with city details
        const partners = await Partner.find(query)
            .populate("city") // <-- Populating city details
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });


        const totalPartners = await Partner.countDocuments(query);

        res.status(200).json({ 
            message: "Fetched Successfully", 
            totalPartners, 
            totalPages: Math.ceil(totalPartners / limit), 
            currentPage: parseInt(page), 
            partners 
        });
    } 
    catch (error) {
        console.error("Error fetching partner profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const getbyIdPartner = async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await Partner.findById(id).populate('city')
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }
        res.status(200).json({ message: "Fetched Successfully", partner });
    }
    catch (error) {
        console.error("Error fetching partner profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}

const updatePartner = async (req, res) => {
    try {
        const {fullName, phone, city, email}=req.body
       const partner = await Partner.findByIdAndUpdate(req.params.id, { fullName, phone, city, email }, { new: true });
               if (!partner) return res.status(404).json({ message: "Partner not found" });

        res.status(200).json({ message: "Fetched Successfully", partner });
    }
    catch (error) {
        console.error("Error fetching partner profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}


const deletePartner= async (req, res) => {
    try {
        const { id } = req.params;
        const partner = await Partner.findByIdAndDelete(id)
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }
        res.status(200).json({ message: "Fetched Successfully", partner });
    }
    catch (error) {
        console.error("Error fetching partner profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}
const getReferredPartners = async (req, res) => {
    try {
        const partnerId = req.user.id;

        if (!partnerId) {
            return res.status(400).json({ message: "Partner ID not found in token" });
        }

        // Find the partner to get the referral code
        const partner = await Partner.findById(partnerId).select("referralCode");

        if (!partner || !partner.referralCode) {
            return res.status(404).json({ message: "Partner not found or referral code not available" });
        }

        // Fetch all bookings made using the partner's referral code
        const referredBookings = await BookApp.find({ usedRefferal: partner.referralCode })
            .populate("createdBy", "fullName phone email city role createdAt")
            .populate("city", "name");

        // Extract unique users from the bookings
        const referredUsers = referredBookings.map(booking => booking.createdBy);

        res.status(200).json({ message: "Fetched Successfully", data: referredUsers });
    } catch (error) {
        console.error("Error fetching referred users:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};




module.exports = { register, sendOtp, verifyOtp, getOwnProfile,getReferredPartners, getallPartner ,getbyIdPartner,updatePartner,deletePartner};
