const AccountDetails = require('../models/addAccountDetails.model');
const User = require('../models/user.models');
const Doctor = require('../models/doctor.model');
const Partner = require('../models/partner.model');

// Add Account Details
exports.addAccountDetails = async (req, res) => {
    try {
        const { bankName, accountNumber, ifscCode, upi } = req.body;
        const { id, role } = req.user; // Assuming authentication middleware provides this

        if (!bankName || !accountNumber || !ifscCode || !upi) {
            return res.status(400).json({ message: "BankName, AccountNumber, IfscCode, and UPI are required" });
        }

        // Determine the model type dynamically based on role
        let createdByModel;
        if (role === 'doctor') createdByModel = 'Doctor';
        else if (role === 'partner') createdByModel = 'Partner';
        else createdByModel = 'User';

        const data = new AccountDetails({
            bankName,
            accountNumber,
            ifscCode,
            upi,
            createdBy: id,
            createdByModel
        });

        await data.save();

        let Model;
        if (role === 'doctor') Model = Doctor;
        else if (role === 'partner') Model = Partner;
        else Model = User;
        await Model.findByIdAndUpdate(id, { isAccountDetails: true }, { new: true });

        res.status(201).json({ message: "Account details added successfully", data });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get All Account Details with User/Doctor/Partner Info
exports.getAllAccountDetails = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);

        // Build search query
        const searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { createdByModel: 'User', createdBy: { $in: await User.find({ fullName: { $regex: search, $options: "i" } }).distinct('_id') } },
                { createdByModel: 'Doctor', createdBy: { $in: await Doctor.find({ doctorName: { $regex: search, $options: "i" } }).distinct('_id') } },
                { createdByModel: 'Partner', createdBy: { $in: await Partner.find({ fullName: { $regex: search, $options: "i" } }).distinct('_id') } }
            ];
        }

        // Fetch paginated account details
        const accountDetails = await AccountDetails.find(searchQuery)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        // Fetch associated User, Doctor, or Partner details
        for (let detail of accountDetails) {
            if (detail.createdByModel === 'User') {
                detail.createdBy = await User.findById(detail.createdBy).select('role fullName email phone commission');
            } else if (detail.createdByModel === 'Doctor') {
                detail.createdBy = await Doctor.findById(detail.createdBy).select('role doctorName email specialization commission');
            } else if (detail.createdByModel === 'Partner') {
                detail.createdBy = await Partner.findById(detail.createdBy).select('role fullName email phone commission');
            }
        }

        // Get total count for pagination
        const totalRecords = await AccountDetails.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalRecords / pageSize);

        res.status(200).json({
            message: "Account details fetched successfully",
            data: accountDetails,
            totalRecords,
            totalPages,
            currentPage: pageNumber
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




// Add Commission
exports.addCommission = async (req, res) => {
    try {
        const { id, role, commission } = req.body;

        if (!id || !role || commission === undefined) {
            return res.status(400).json({ message: "User ID, Role, and Commission are required" });
        }

        let updatedUser;

        if (role === "user") {
            updatedUser = await User.findByIdAndUpdate(
                id,
                { $inc: { commission: commission } },
                { new: true }
            ).select("fullName email phone commission");
        } else if (role === "doctor") {
            updatedUser = await Doctor.findByIdAndUpdate(
                id,
                { $inc: { commission: commission } },
                { new: true }
            ).select("doctorName email specialization commission");
        } else if (role === "partner") {
            updatedUser = await Partner.findByIdAndUpdate(
                id,
                { $inc: { commission: commission } },
                { new: true }
            ).select("fullName email phone commission");
        } else {
            return res.status(400).json({ message: "Invalid role. Must be 'User', 'Doctor', or 'Partner'" });
        }

        if (!updatedUser) {
            return res.status(404).json({ message: "User/Doctor/Partner not found" });
        }

        res.status(200).json({ message: "Commission added successfully", data: updatedUser });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Commission
exports.updateCommission = async (req, res) => {
    try {
        const { id, role, commission } = req.body;

        if (!id || !role || commission === undefined) {
            return res.status(400).json({ message: "User ID, Role, and Commission are required" });
        }

        let updatedUser;

        if (role === "user") {
            updatedUser = await User.findByIdAndUpdate(
                id,
                { $set: { commission: commission } },
                { new: true }
            ).select("fullName email phone commission");
        } else if (role === "doctor") {
            updatedUser = await Doctor.findByIdAndUpdate(
                id,
                { $set: { commission: commission } },
                { new: true }
            ).select("doctorName email specialization commission");
        } else if (role === "partner") {
            updatedUser = await Partner.findByIdAndUpdate(
                id,
                { $set: { commission: commission } },
                { new: true }
            ).select("fullName email phone commission");
        } else {
            return res.status(400).json({ message: "Invalid role. Must be 'User', 'Doctor', or 'Partner'" });
        }

        if (!updatedUser) {
            return res.status(404).json({ message: "User/Doctor/Partner not found" });
        }

        res.status(200).json({ message: "Commission updated successfully", data: updatedUser });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
