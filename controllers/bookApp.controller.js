const BookApp = require('../models/bookApp.model');
const Condition = require('../models/conditions.model');
const City = require('../models/city.model');
const User = require('../models/user.models');
const Doctor = require('../models/doctor.model');
const Partner = require('../models/partner.model');
const createApp = async (req, res) => {
    try {
        const { name, cityId, relation,age, treatmentCondition, date, gender, usedRefferal, doctorId } = req.body;
        const createdBy = req.user.id; // Extract user ID from authentication
        console.log(req.body, "req.body");

        if (!name || !cityId || !relation || !treatmentCondition || !date || !gender ||!age) {
            return res.status(400).json({ message: "name, city, relation,age, treatmentCondition, date, and gender are required" });
        }

        const datecurrent = new Date(date);
        if (isNaN(datecurrent.getTime())) {
            return res.status(400).json({ message: "Invalid date format for date" });
        }

        // Validate Condition ID
        const condition = await Condition.findById(treatmentCondition);
        if (!condition) return res.status(404).json({ message: "Condition ID not found" });

        // Validate City ID
        const city = await City.findById(cityId);
        if (!city) return res.status(404).json({ message: "City ID not found" });

        // Validate Doctor ID (optional)
        let doctor = null;
        if (doctorId) {
            doctor = await Doctor.findById(doctorId);
            if (!doctor) return res.status(404).json({ message: "Doctor ID not found" });
        }

        let referredUser = null;
        let referredDoctor = null;
        let referredPartner = null;

        if (usedRefferal) {
            // Check if the referral code belongs to a user
            referredUser = await User.findOne({ referralCode: usedRefferal });

            // If not a user, check if it's a doctor's referral code
            if (!referredUser) {
                referredDoctor = await Doctor.findOne({ referralCode: usedRefferal });
            }
            if (!referredUser && !referredDoctor) { // Corrected condition
                referredPartner = await Partner.findOne({ referralCode: usedRefferal });
            }
            
            
            // If referral code is invalid (not found for a user or doctor)
            if (!referredUser && !referredDoctor &&!referredPartner) {
                return res.status(400).json({ message: "Invalid referral code" });
            }

            // If referral code belongs to a user, update their referrals list
            if (referredUser) {
                if (!referredUser.referrals.includes(createdBy)) {
                    referredUser.referrals.push(createdBy);
                    await referredUser.save();
                }
            }
        }

        // Create a new appointment
        const bookApp = new BookApp({
            name,
            city: city._id,
            age,
            relation,
            treatmentCondition: condition._id,
            date: date,
            gender,
            usedRefferal: usedRefferal || null,
            createdBy,
            doctorId: doctor?._id || null
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
            .populate("doctorId", "doctorName")
            .lean(); // Convert Mongoose docs to plain JS objects

        // Fetch referral details dynamically
        for (let app of bookApps) {
            if (app.usedRefferal) {
                const user = await User.findOne({ referralCode: app.usedRefferal }).select("fullName email phone role");
                const doctor = await Doctor.findOne({ referralCode: app.usedRefferal }).select("doctorName email role specialization");
                const partner = await Partner.findOne({ referralCode: app.usedRefferal }).select("fullName email phone role"); // Partner details

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
                } else if (partner) {
                    app.referredBy = {
                        _id: partner._id,
                        name: partner.fullName,
                        email: partner.email,
                        phone: partner.phone,
                        role: partner.role
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
            .populate("doctorId", "doctorName")
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
            .populate("doctorId", "doctorName")
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

//get appointment by doctorId
const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id; // Token se doctor ki ID le rahe hain

        // Sirf wahi appointments le jo iss doctor se judi ho
        const appointments = await BookApp.find({ doctorId }).sort({ createdAt: -1 }).populate("city", "name")
        .populate("treatmentCondition", "name")

        if (!appointments || appointments.length === 0) {
            return res.status(404).json({ message: "No appointments found for this doctor" });
        }

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};






module.exports = { createApp, getAllBookApps, getBookAppById, getOwnBookApps,getDoctorAppointments }