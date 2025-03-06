const Conditions = require('../models/conditions.model')
const Treatments = require('../models/treatments.model')
const mongoose = require("mongoose");
exports.addConditions = async (req, res) => {
    try {
        const { name, overview, treatmentsId } = req.body;
        console.log(treatmentsId, "treatmentsId")
        if (!mongoose.Types.ObjectId.isValid(treatmentsId)) {
            return res.status(400).json({ message: 'Invalid Treatment ID format' });
        }

        // Find Treatment by ID
        const treatment = await Treatments.findById(treatmentsId);
        if (!treatment) {
            return res.status(404).json({ message: 'Treatment ID not found' });
        }

        // Handle image upload
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        // Create new condition
        const condition = new Conditions({
            name,
            image,
            treatments: treatment._id,  // Store as ObjectId
            overview
        });

        await condition.save();
        res.status(201).json({ message: "Condition added successfully", condition });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};



exports.getAllConditions = async (req, res) => {
    try {
        const conditions = await Conditions.find().populate('treatments');
        res.status(200).json(conditions);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getConditionsById = async (req, res) => {
    try {
        const conditions = await Conditions.findById(req.params.id).populate('treatments');
        if (!conditions) return res.status(404).json({ message: "Conditions not found" });
        res.status(200).json(conditions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateConditions = async (req, res) => {
    try {
        const { id } = req.params; // Condition ID to update
        const { name, overview, treatmentsId } = req.body;

        console.log("Updating condition with ID:", id);

        // Find the existing condition
        let condition = await Conditions.findById(id);
        if (!condition) {
            return res.status(404).json({ message: "Condition not found" });
        }

        // Validate and update the treatment ID if provided
        if (treatmentsId) {
            if (!mongoose.Types.ObjectId.isValid(treatmentsId)) {
                return res.status(400).json({ message: "Invalid Treatment ID format" });
            }

            const treatment = await Treatments.findById(treatmentsId);
            if (!treatment) {
                return res.status(404).json({ message: "Treatment ID not found" });
            }

            condition.treatments = treatment._id; // Update treatment reference
        }

        // Handle image update (keep old image if not provided)
        const image = req.file ? `/uploads/${req.file.filename}` : condition.image;

        // Update fields only if provided
        condition.name = name || condition.name;
        condition.image = image;
        condition.overview = overview || condition.overview;

        // Save the updated condition
        await condition.save();

        res.status(200).json({ message: "Condition updated successfully", condition });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.deleteConditions = async (req, res) => {
    try {
        const conditions = await Conditions.findByIdAndDelete(req.params.id);
        if (!conditions) return res.status(404).json({ message: "Conditions not found" });

        res.status(200).json({ message: "Conditions deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
