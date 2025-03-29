const Conditions = require('../models/conditions.model')
const Treatments = require('../models/treatments.model')
const mongoose = require("mongoose");
exports.addConditions = async (req, res) => {
    try {
        const { name, overview, treatmentsId } = req.body;
        console.log(treatmentsId, "treatmentsId");

        // Handle single or multiple treatment IDs
        const treatmentIds = Array.isArray(treatmentsId) ? treatmentsId : [treatmentsId];

        if (treatmentIds.length === 0) {
            return res.status(400).json({ message: 'Please provide valid Treatment IDs' });
        }

        const validTreatmentIds = [];
        for (const id of treatmentIds) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: `Invalid Treatment ID format: ${id}` });
            }

            const treatment = await Treatments.findById(id);
            if (!treatment) {
                return res.status(404).json({ message: `Treatment ID not found: ${id}` });
            }

            validTreatmentIds.push(id);
        }

        // Handle image upload
        const image = req.file ? req.file.location : null;

        // Create new condition
        const condition = new Conditions({
            name,
            image,
            treatments: validTreatmentIds,
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
        const { id } = req.params;
        const { name, overview, treatmentsId } = req.body;

        console.log("Updating condition with ID:", id);

        let condition = await Conditions.findById(id);
        if (!condition) {
            return res.status(404).json({ message: "Condition not found" });
        }

        // Validate and update the treatment IDs if provided
        const validTreatmentIds = [];
        if (Array.isArray(treatmentsId) && treatmentsId.length > 0) {
            for (const treatmentId of treatmentsId) {
                if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
                    return res.status(400).json({ message: `Invalid Treatment ID format: ${treatmentId}` });
                }

                const treatment = await Treatments.findById(treatmentId);
                if (!treatment) {
                    return res.status(404).json({ message: `Treatment ID not found: ${treatmentId}` });
                }

                validTreatmentIds.push(treatmentId);
            }
        }

        // Handle image update (keep old image if not provided)
        const image = req.file ? req.file.location : condition.image;

        // Update fields only if provided
        condition.name = name || condition.name;
        condition.image = image;
        condition.overview = overview || condition.overview;
        condition.treatments = validTreatmentIds.length > 0 ? validTreatmentIds : condition.treatments;

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


