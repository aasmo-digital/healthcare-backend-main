const Treatments = require('../models/treatments.model')

exports.addTreatments = async (req, res) => {
    try {
        const { name, treatmentDuration, treatmentCost,overview } = req.body;

        // Extract the uploaded file name
        const image = req.file ? req.file.filename : null; 

        // Ensure treatmentDuration and treatmentCost are parsed correctly
        const parsedDuration = Array.isArray(treatmentDuration) 
            ? treatmentDuration 
            : JSON.parse(treatmentDuration || "[]");
            
        const parsedCost = Array.isArray(treatmentCost) 
            ? treatmentCost 
            : JSON.parse(treatmentCost || "[]");

        // Create the treatment entry
        const treatment = new Treatments({
            name,
            overview,
            image: image ? `/uploads/${image}` : null,
            treatmentDuration: parsedDuration,
            treatmentCost: parsedCost
        });

        await treatment.save();
        res.status(201).json({ message: "Treatment added successfully", treatment });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllTreatments = async (req, res) => {
    try {
        const treatment = await Treatments.find();
        res.status(200).json(treatment);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getTreatmentsById = async (req, res) => {
    try {
        const treatment = await Treatments.findById(req.params.id);
        if (!treatment) return res.status(404).json({ message: "Treatment not found" });
        res.status(200).json(treatment);
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateTreatments = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, treatmentDuration, treatmentCost,overview } = req.body;

        let treatment = await Treatments.findById(id);
        if (!treatment) {
            return res.status(404).json({ message: "Treatment not found" });
        }

        // Handle image update
        const image = req.file ? `/uploads/${req.file.filename}` : treatment.image;

        // Preserve existing treatmentDuration & treatmentCost if not provided in request
        const parsedDuration = treatmentDuration
            ? Array.isArray(treatmentDuration)
                ? treatmentDuration
                : JSON.parse(treatmentDuration || "[]")
            : treatment.treatmentDuration;

        const parsedCost = treatmentCost
            ? Array.isArray(treatmentCost)
                ? treatmentCost
                : JSON.parse(treatmentCost || "[]")
            : treatment.treatmentCost;

        // Update treatment fields
        treatment.name = name || treatment.name;
        treatment.overview = overview || treatment.overview;
        treatment.image = image;
        treatment.treatmentDuration = parsedDuration;
        treatment.treatmentCost = parsedCost;

        await treatment.save();

        res.status(200).json({ message: "Treatment updated successfully", treatment });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteTreatments = async (req, res) => {
    try {
        const treatment = await Treatments.findByIdAndDelete(req.params.id);
        if (!treatment) return res.status(404).json({ message: "Treatment not found" });
        
        res.status(200).json({ message: "Treatment deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
