const Doctor = require("../models/doctor.model");
const Hospital = require("../models/hospital.model");
const User = require("../models/user.models");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Add Doctor API
exports.addDoctors = async (req, res) => {
    try {
        const { doctorName, email, password, specialization, hospitals, address, experience, education,clients, about } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hospitals)) {
            return res.status(400).json({ message: "Invalid Hospital ID format" });
        }

        const hospital = await Hospital.findById(hospitals);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital ID not found" });
        }

        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // ✅ Ensure password is hashed correctly
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const doctor = new Doctor({
            doctorName,
            email,
            password,
            specialization,
            address,
            experience,
            education,
            image,
            clients,
            about,
            hospitals: hospital._id
        });
        console.log(hashedPassword,"hashedPassword")
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
        const { doctorName, email, password, specialization, hospitals, address, experience, education,clients, about } = req.body;

        let doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if (hospitals) {
            if (!mongoose.Types.ObjectId.isValid(hospitals)) {
                return res.status(400).json({ message: "Invalid Hospital ID format" });
            }
            const hospital = await Hospital.findById(hospitals);
            if (!hospital) {
                return res.status(404).json({ message: "Hospital ID not found" });
            }
            doctor.hospitals = hospital._id;
        }

        const image = req.file ? `/uploads/${req.file.filename}` : doctor.image;
        if (password) {
            doctor.password = await bcrypt.hash(password, 10);
        }

        doctor.doctorName = doctorName || doctor.doctorName;
        doctor.email = email || doctor.email;
        doctor.image = image;
        doctor.specialization = specialization || doctor.specialization;
        doctor.address = address || doctor.address;
        doctor.education=education||doctor.education;
        doctor.experience = experience || doctor.experience;
        doctor.clients = clients || doctor.clients;
        doctor.about = about || doctor.about;

        await doctor.save();

        res.status(200).json({ message: "Doctor updated successfully", doctor });

    } catch (error) {
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



