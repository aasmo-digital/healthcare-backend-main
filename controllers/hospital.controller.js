const Hospital = require('../models/hospital.model');
const Doctor = require('../models/doctor.model');
const Conditions = require('../models/conditions.model');
const mongoose = require("mongoose");
const path = require("path");
const addHospital = async (req, res) => {
    try {
        const { hospitalName, address, conditions, overview } = req.body;

        // Handle single or multiple condition IDs
        const conditionIds = Array.isArray(conditions) ? conditions : [conditions];

        if (conditionIds.length === 0) {
            return res.status(400).json({ message: 'Please provide valid condition IDs' });
        }

        const validConditions = [];
        for (const id of conditionIds) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: `Invalid condition ID format: ${id}` });
            }

            const condition = await Conditions.findById(id);
            if (!condition) {
                return res.status(404).json({ message: `Condition ID not found: ${id}` });
            }

            validConditions.push(id);
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.location);
        }

        const hospital = new Hospital({
            hospitalName,
            address,
            conditions: validConditions,
            overview,
            images: imageUrls,
        });

        await hospital.save();
        res.status(201).json({ success: true, message: "Hospital added successfully", hospital });
    } catch (error) {
        console.error("Error adding hospital:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
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
        const { hospitalName, address, conditions, overview } = req.body;
        const { id } = req.params;

        // Find the existing hospital
        const hospital = await Hospital.findById(id);
        if (!hospital) {
            return res.status(404).json({ success: false, message: "Hospital not found" });
        }

        let imageUrls = hospital.images; // Keep existing images by default

        // If new images are uploaded, replace existing images
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.location);
        }

        // Ensure `conditions` is a valid array of ObjectIds
        let conditionsIds = hospital.conditions; // Keep existing value if not provided
        if (conditions) {
            try {
                // Parse conditions if received as a JSON string
                const parsedConditions = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
                if (Array.isArray(parsedConditions)) {
                    conditionsIds = parsedConditions.map(condition => {
                        if (mongoose.Types.ObjectId.isValid(condition)) {
                            return new mongoose.Types.ObjectId(condition);
                        } else {
                            throw new Error("Invalid conditions ID");
                        }
                    });
                } else {
                    return res.status(400).json({ success: false, message: "Conditions should be an array" });
                }
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid conditions format" });
            }
        }

        // Perform the update
        const updatedHospital = await Hospital.findByIdAndUpdate(
            id,
            {
                hospitalName,
                address,
                conditions: conditionsIds, // Update with an array of ObjectIds
                overview,
                images: imageUrls,
            },
            { new: true }
        );

        if (!updatedHospital) {
            return res.status(500).json({ success: false, message: "Failed to update hospital" });
        }

        res.status(200).json({ success: true, message: "Hospital updated successfully", hospital: updatedHospital });

    } catch (error) {
        console.error("Error updating hospital:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
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

const getHospitalsByCondition = async (req, res) => {
    try {
        const { conditionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conditionId)) {
            return res.status(400).json({ message: "Invalid Condition ID format" });
        }

        // Find hospitals that include this conditionId
        const hospitals = await Hospital.find({ conditions: conditionId });

        if (!hospitals.length) {
            return res.status(404).json({ message: "No hospitals found for this condition" });
        }

        // Extract hospital IDs
        const hospitalIds = hospitals.map(hospital => hospital._id);

        // Find doctors who work in these hospitals
        const doctors = await Doctor.find({ hospitals: { $in: hospitalIds } });

        res.status(200).json({
            success: true,
            hospitals,
            doctors
        });

    } catch (error) {
        console.error("Error fetching hospitals and doctors:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};




module.exports = { addHospital, getallHospital, getbyIdHospital, updateHospital, getHospitalsByCondition, deleteHospital, getallHospitalUser }