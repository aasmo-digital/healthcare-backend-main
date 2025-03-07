const Bannner = require('../models/banner.model');

exports.create = async (req, res) => {
    try {
        const { name, url } = req.body;
        if (!name || !url || !req.file) {
            res.status(400).json({ message: "Name, URL, and image are required." })
        }

        const image = req.file ? req.file.location : null; 
        const data = new Bannner({
            name,
            url,
            image
        })
        await data.save()
        res.status(200).json({ message: "Banner Created Successfully.." })
    }
    catch (error) {
        console.log('error', error)
        res.status(500).json({ message: 'Internal Server error', error: message.error })
    }
}

exports.getAllBanner = async (req, res) => {
    try {
        const banner = await Bannner.find()
        res.status(200).json({ message: "Feched Successfully...", banner })
    }
    catch (error) {
        console.log('error', error)
        res.status(500).json({ message: 'Internal Server error', error: message.error })
    }
}

exports.getbyIdBanner = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(404).json({ message: "id is Requierd.." })
        }
        const banner = await Bannner.findById(id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        res.status(200).json({ message: "Feched Successfully...", banner })
    }
    catch (error) {
        console.log('error', error)
        res.status(500).json({ message: 'Internal Server error', error: message.error })
    }
}

exports.updateTreatments = async (req, res) => {
    try {
        const { id } = req.params;
        const {name, url } = req.body;

        let banner = await Bannner.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Bannner not found" });
        }

        // Handle image update
        // const image = req.file ? `/uploads/${req.file.filename}` : banner.image;
        const image = req.file ? req.file.location :  banner.image; 
        banner.name = name || banner.name;
        banner.url = url || banner.url;
        banner.image = image;
      

        await banner.save();

        res.status(200).json({ message: "Bannner updated successfully", banner });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Bannner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: "Bannner not found" });
        
        res.status(200).json({ message: "Bannner deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};