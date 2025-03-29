const Doctor = require("../models/doctor.model");
const Hospital = require("../models/hospital.model");
const DoctorRefferalHospital = require("../models/doctorRefferalHospitals.model");
const User = require("../models/user.models");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Add Doctor API
exports.addDoctors = async (req, res) => {
    try {
        const { doctorName, specialization, hospitals, overview } = req.body;

        // Handle single or multiple hospital IDs
        const hospitalIds = Array.isArray(hospitals) ? hospitals : [hospitals];

        if (hospitalIds.length === 0) {
            return res.status(400).json({ message: 'Please provide valid hospital IDs' });
        }

        const validHospitals = [];
        for (const id of hospitalIds) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: `Invalid hospital ID format: ${id}` });
            }

            const hospital = await Hospital.findById(id);
            if (!hospital) {
                return res.status(404).json({ message: `Hospital ID not found: ${id}` });
            }

            validHospitals.push(id);
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.location);
        }

        const doctor = new Doctor({
            doctorName,
            specialization,
            images: imageUrls,
            hospitals: validHospitals,
            overview
        });

        await doctor.save();
        res.status(201).json({ message: "Doctor added successfully", doctor });

    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Get All Doctors API
exports.getAllDoctors = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { doctorName: { $regex: search, $options: "i" } },
            ];
        }
        const pageNumber = Math.max(1, parseInt(page)); // Ensure page is at least 1
        const limitNumber = Math.max(1, parseInt(limit)); // Ensure limit is at least 1
        const skip = (pageNumber - 1) * limitNumber;


        const doctors = await Doctor.find(query)
            .populate("hospitals")
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 });

        const totalDoctors = await Doctor.countDocuments(query);


        res.status(200).json({
            message: "Fetched Successfully",
            totalDoctors,
            totalPages: Math.ceil(totalDoctors / limitNumber),
            currentPage: pageNumber,
            doctors
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Doctor By ID API
exports.getDoctorsById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate("hospitals referrals");
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });
        res.status(200).json(doctor);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Doctor API
exports.updateDoctors = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorName, specialization, hospitals, overview } = req.body;

        // Handle single or multiple hospital IDs
        const hospitalIds = Array.isArray(hospitals) ? hospitals : [hospitals];

        if (hospitalIds.length === 0) {
            return res.status(400).json({ message: 'Please provide valid hospital IDs' });
        }

        const validHospitals = [];
        for (const id of hospitalIds) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: `Invalid hospital ID format: ${id}` });
            }

            const hospital = await Hospital.findById(id);
            if (!hospital) {
                return res.status(404).json({ message: `Hospital ID not found: ${id}` });
            }

            validHospitals.push(id);
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.location);
        }

        const updatedData = {
            doctorName,
            specialization,
            overview,
            hospitals: validHospitals
        };

        // Include images only if new ones are uploaded
        if (imageUrls.length > 0) {
            updatedData.images = imageUrls;
        }

        const doctor = await Doctor.findByIdAndUpdate(id, updatedData, { new: true });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: "Doctor updated successfully", doctor });

    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete Doctor API
exports.deleteDoctors = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        res.status(200).json({ message: "Doctor deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Doctor Login API
exports.loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Received email:", email);
        console.log("Received password:", password); // Debugging

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
        if (!doctor) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log("Stored Hashed Password:", doctor.password); // Debugging

        const isMatch = await bcrypt.compare(password, doctor.password);
        console.log("Password Match:", isMatch); // Debugging

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ Include `id` and `role` in token
        const token = jwt.sign(
            { id: doctor._id, role: "doctor", email: doctor.email },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            message: "Login successful",
            doctor: {
                id: doctor._id,
                doctorName: doctor.doctorName,
                email: doctor.email,
                specialization: doctor.specialization,
                hospitals: doctor.hospitals,
                image: doctor.image,
                referralCode: doctor.referralCode,
            },
            token
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};




// Get Doctor  own profile doctor
exports.getDoctorsOwnProfile = async (req, res) => {
    try {
        console.log("User Data in Request:", req.user); // ✅ Debugging

        const id = req.user.id;
        if (!id) return res.status(400).json({ message: "User ID is missing from request." });

        const doctor = await Doctor.findById(id).populate("hospitals referrals");
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        res.status(200).json(doctor);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};




exports.addToWishlist = async (req, res) => {
    try {
        const { doctorId } = req.params; // Doctor ID from request params

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        doctor.iswhishlist = "true";
        await doctor.save();

        res.status(200).json({ success: true, message: "Added to Wishlist", doctor });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


exports.removeFromWishlist = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        doctor.iswhishlist = "false";
        await doctor.save();

        res.status(200).json({ success: true, message: "Removed from Wishlist", doctor });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.refferalhospital = async (req, res) => {
    try {
        const { hospitalId, refferalCode } = req.body;
        if (!hospitalId || !refferalCode) return res.status(400).json({ message: "All fields required" });

        const refferalshospital = new DoctorRefferalHospital({
            hospitalId,
            refferalCode
        });
        await refferalshospital.save();
        res.status(201).json({ message: "Refferal added successfully", refferalshospital });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getOwnRefferals = async (req, res) => {
    try {
        const doctorId = req.user.id; // Getting logged-in doctor ID from auth middleware

        // Find referrals where the referral code matches the logged-in doctor's code
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const referrals = await DoctorRefferalHospital.find({ refferalCode: doctor.referralCode }).populate("hospitalId");

        res.status(200).json({ success: true, referrals });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.getAllRefferals = async (req, res) => {
    try {
        // Check if the logged-in user is an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        // Get all referrals with doctor and hospital details
        const allReferrals = await DoctorRefferalHospital.find()
            .populate("hospitalId") // Get hospital details
            .lean(); // Convert Mongoose documents to plain objects

        // Fetch doctor details based on referralCode
        for (let referral of allReferrals) {
            const doctor = await Doctor.findOne({ referralCode: referral.refferalCode }).select("doctorName email specialization image");
            referral.doctor = doctor || null; // Add doctor details
        }

        res.status(200).json({ success: true, referrals: allReferrals });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};