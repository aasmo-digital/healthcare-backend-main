const Hospital = require('../models/hospital.model');
const Conditions = require('../models/conditions.model');
const mongoose = require("mongoose");
const path = require("path");
const addHospital = async (req, res) => {
    try {
        const { hospitalName, address, conditions, overview, timings, specialitiesTreatments } = req.body;
        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        }

        const parsedSpecialities = specialitiesTreatments ? JSON.parse(specialitiesTreatments) : [];

        const hospital = new Hospital({
            hospitalName,
            address,
            conditions,
            overview,
            timings,
            images: imageUrls, // Fix: Ensure the field name matches the schema
            specialitiesTreatments: parsedSpecialities
        });

        await hospital.save();
        res.status(201).json({ success: true, message: "Hospital added successfully", hospital });
    } catch (error) {
        console.error("Error adding hospital:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getallHospital = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { hospitalName: { $regex: search, $options: "i" } },
            ];
        }

        const pageNumber = Math.max(1, parseInt(page)); // Ensure page is at least 1
        const limitNumber = Math.max(1, parseInt(limit)); // Ensure limit is at least 1
        const skip = (pageNumber - 1) * limitNumber;

        const hospitals = await Hospital.find(query)
            .populate("conditions")
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 });

        const totalHospital = await Hospital.countDocuments(query);

        res.status(200).json({
            message: "Fetched Successfully",
            totalHospital,
            totalPages: Math.ceil(totalHospital / limitNumber),
            currentPage: pageNumber,
            hospitals
        });
    } catch (error) {
        console.error("Error fetching hospitals:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};



const getallHospitalUser = async (req, res) => {
    try {

        const hospital = await Hospital.find()
            .populate("conditions")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Fetched Successfully",
            hospital,
        });
    }
    catch (error) {
        console.error("Error fetching user Hospital:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getbyIdHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const hospital = await Hospital.findById(id)
            .populate({
                path: 'conditions',
                populate: {
                    path: 'treatments',  // Populating treatments inside conditions
                    model: 'Treatments'
                }
            });

        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        res.status(200).json({ message: "Fetched Successfully", hospital });
    } catch (error) {
        console.error("Error fetching hospital details:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const updateHospital = async (req, res) => {
    try {
        const { hospitalName, address, conditions, overview, timings, specialitiesTreatments } = req.body;
        const { id } = req.params;

        // Find the existing hospital
        const hospital = await Hospital.findById(id);
        if (!hospital) {
            return res.status(404).json({ success: false, message: "Hospital not found" });
        }

        let imageUrls = hospital.images; // Keep existing images by default

        // If new images are uploaded, replace existing images
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Ensure `conditions` is a valid ObjectId
        let conditionsId = hospital.conditions; // Keep existing value if not provided
        if (conditions) {
            if (mongoose.Types.ObjectId.isValid(conditions)) {
                conditionsId = new mongoose.Types.ObjectId(conditions);
            } else {
                return res.status(400).json({ success: false, message: "Invalid conditions ID" });
            }
        }

        // Parse `specialitiesTreatments` safely
        let parsedSpecialities = hospital.specialitiesTreatments; // Keep existing value
        if (specialitiesTreatments) {
            try {
                parsedSpecialities = typeof specialitiesTreatments === "string"
                    ? JSON.parse(specialitiesTreatments)
                    : specialitiesTreatments;
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid specialitiesTreatments format" });
            }
        }

        // Debugging logs
        console.log("Updating hospital ID:", id);
        console.log("New Conditions ID:", conditionsId);
        console.log("Existing Conditions in DB:", hospital.conditions);

        // Perform the update
        const updatedHospital = await Hospital.findByIdAndUpdate(
            id,
            {
                hospitalName,
                address,
                conditions: conditionsId, // Ensure this is an ObjectId
                overview,
                timings,
                images: imageUrls,
                specialitiesTreatments: parsedSpecialities
            },
            { new: true }
        );

        if (!updatedHospital) {
            return res.status(500).json({ success: false, message: "Failed to update hospital" });
        }

        res.status(200).json({ success: true, message: "Hospital updated successfully", hospital: updatedHospital });

    } catch (error) {
        console.error("Error updating hospital:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};







const deleteHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const hospital = await Hospital.findByIdAndDelete(id)
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }
        res.status(200).json({ message: "Deleted Successfully", });
    }
    catch (error) {
        console.error("Error Deleted hospital profile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });

    }
}


module.exports = { addHospital, getallHospital, getbyIdHospital, updateHospital, deleteHospital, getallHospitalUser }