const Doctor = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');
const Conditions = require('../models/conditions.model');
const Treatments = require('../models/treatments.model');
exports.search = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const words = query.trim().split(/\s+/); // Split query into words
        const regexConditions = words.map(word => ({ doctorName: { $regex: word, $options: "i" } }));

        const doctors = await Doctor.find({ $and: regexConditions });
        const hospitals = await Hospital.find({ $and: words.map(word => ({ hospitalName: { $regex: word, $options: "i" } })) });
        const conditions = await Conditions.find({ $and: words.map(word => ({ name: { $regex: word, $options: "i" } })) });
        const treatments = await Treatments.find({ $and: words.map(word => ({ name: { $regex: word, $options: "i" } })) });
        res.status(200).json({
            success: true,
            doctors,
            hospitals,
            conditions,
            treatments
        });
    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

