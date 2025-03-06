const BookApp = require('../models/bookApp.model');
const Condition = require('../models/conditions.model');
const City = require('../models/city.model');
const User = require('../models/user.models');
const Doctor = require('../models/doctor.model');
const createApp = async (req, res) => {
    try {
        const { name, cityId, relation, treatmentCondition, dob, gender, usedRefferal } = req.body;
        const createdBy = req.user.id; // Extract user ID from authentication
        console.log(req.body, "req.body")
        if (!name || !cityId || !relation || !treatmentCondition || !dob || !gender) {
            return res.status(400).json({ message: "name, city, relation, treatmentCondition, dob, and gender are required" });
        }

        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format for dob" });
        }

        const condition = await Condition.findById(treatmentCondition);
        if (!condition) return res.status(404).json({ message: "Condition ID not found" });

        const city = await City.findById(cityId);
        if (!city) return res.status(404).json({ message: "City ID not found" });

        if (usedRefferal) {
            const refferalCheckUser = await User.findOne({ referralCode: usedRefferal });
            const refferalCheckDoctor = await Doctor.findOne({ referralCode: usedRefferal });

            if (!refferalCheckUser && !refferalCheckDoctor) {
                return res.status(400).json({ message: "Incorrect referral code for user or doctor" });
            }
        }

        const bookApp = new BookApp({
            name,
            city: city._id,
            relation,
            treatmentCondition: condition._id,
            dob: dobDate,
            gender,
            usedRefferal: usedRefferal || null,
            createdBy,
        });

        await bookApp.save();
        res.status(201).json({ success: true, message: "Appointment booked successfully" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getAllBookApps = async (req, res) => {
    try {
        let { page, limit, search } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const query = {};

        // Search by name, relation, or gender
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { relation: { $regex: search, $options: "i" } },
                { gender: { $regex: search, $options: "i" } }
            ];
        }

        const total = await BookApp.countDocuments(query);
        const bookApps = await BookApp.find(query)
            .populate("city", "name")
            .populate("treatmentCondition", "name")
            .lean(); // Convert Mongoose docs to plain JS objects

        // Fetch referral details dynamically
        for (let app of bookApps) {
            if (app.usedRefferal) {
                const user = await User.findOne({ referralCode: app.usedRefferal }).select("fullName email phone role");
                const doctor = await Doctor.findOne({ referralCode: app.usedRefferal }).select("doctorName email role specialization");

                if (user) {
                    app.referredBy = {
                        _id: user._id,
                        name: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    };
                } else if (doctor) {
                    app.referredBy = {
                        _id: doctor._id,
                        name: doctor.doctorName || doctor.fullName || "Unknown",
                        email: doctor.email,
                        role: doctor.role,
                        specialization: doctor.specialization
                    };
                } else {
                    app.referredBy = null;
                }
            }
        }

        res.status(200).json({
            success: true,
            total,
            page,
            limit,
            bookApps
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getBookAppById = async (req, res) => {
    try {
        const { id } = req.params;
        const bookApp = await BookApp.findById(id)
            .populate("city", "name")
            .populate("treatmentCondition", "name")
            .lean();

        if (!bookApp) {
            return res.status(404).json({ message: "BookApp not found" });
        }

        // Fetch referral details if available
        if (bookApp.usedRefferal) {
            const user = await User.findOne({ referralCode: bookApp.usedRefferal }).select("fullName email phone role");
            const doctor = await Doctor.findOne({ referralCode: bookApp.usedRefferal }).select("doctorName fullName email phone role specialization");

            if (user) {
                bookApp.referredBy = {
                    _id: user._id,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                };
            } else if (doctor) {
                bookApp.referredBy = {
                    _id: doctor._id,
                    name: doctor.doctorName || doctor.fullName || "Unknown",
                    email: doctor.email,
                    phone: doctor.phone,
                    role: doctor.role,
                    specialization: doctor.specialization
                };
            } else {
                bookApp.referredBy = null;
            }
        }

        res.status(200).json({ success: true, bookApp });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getOwnBookApps = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from authenticated request

        const bookApps = await BookApp.find({ createdBy: userId })
            .select("-otp -otpExpires") // Exclude OTP fields
            .populate("city", "name")
            .populate("treatmentCondition", "name")
            .lean();

        // Fetch referral details dynamically
        for (let app of bookApps) {
            if (app.usedRefferal) {  // Fixed typo
                const user = await User.findOne({ referralCode: app.usedRefferal }).select("fullName email phone role");
                const doctor = await Doctor.findOne({ referralCode: app.usedRefferal }).select("doctorName fullName email phone role specialization");

                if (user) {
                    app.referredBy = {
                        _id: user._id,
                        name: user.fullName,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    };
                } else if (doctor) {
                    app.referredBy = {
                        _id: doctor._id,
                        name: doctor.doctorName || doctor.fullName || "Unknown",
                        email: doctor.email,
                        phone: doctor.phone,
                        role: doctor.role,
                        specialization: doctor.specialization
                    };
                } else {
                    app.referredBy = null;
                }
            }
        }

        res.status(200).json({ success: true, total: bookApps.length, bookApps });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




module.exports = { createApp, getAllBookApps, getBookAppById, getOwnBookApps }