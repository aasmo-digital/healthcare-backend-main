const Doctor = require('../models/doctor.model');
const Hospital = require('../models/hospital.model');
const Conditions = require('../models/conditions.model');

exports.search = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ messgae: "Search query is required" });
        }
        const searchQuery = { $regex: query, $options: "i" };
        const doctors = await Doctor.find({ doctorName: searchQuery })
        const hospitals = await Hospital.find({ hospitalName: searchQuery });
        const conditions = await Conditions.find({ name: searchQuery });
        res.status(200).json({
            sucess: true,
            doctors,
            hospitals,
            conditions
        })
    }
    catch (error) {
        console.log("Error", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}