const City = require('../models/city.model')

exports.addCity = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "City name is required" });

        const city = new City({ name });
        await city.save();
        res.status(201).json({ message: "City added successfully", city });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllCities = async (req, res) => {
    try {
        const cities = await City.find();
        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCityById = async (req, res) => {
    try {
        const city = await City.findById(req.params.id);
        if (!city) return res.status(404).json({ message: "City not found" });
        res.status(200).json(city);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCity = async (req, res) => {
    try {
        const { name } = req.body;
       

        const city = await City.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!city) return res.status(404).json({ message: "City not found" });
        
        res.status(200).json({ message: "City updated successfully", city });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCity = async (req, res) => {
    try {
        const city = await City.findByIdAndDelete(req.params.id);
        if (!city) return res.status(404).json({ message: "City not found" });
        
        res.status(200).json({ message: "City deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
