const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ msg: "Please provide all required fields" });
    }

    try {
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ message: "Admin already exists", errorCode: "ADMIN_EXISTS" });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        admin = new Admin({ email, password: hashedPassword });
        await admin.save();

        res.status(201).json({ message: "Admin registered successfully" });
    } catch (error) {
        console.error("Error during admin registration:", error.message);
        res.status(500).json({ message: "Server error occurred. Please try again later.", errorCode: "SERVER_ERROR" });
    }
};

// Login API
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Please provide all required fields" });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Invalid credentials", errorCode: "INVALID_CREDENTIALS" });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials", errorCode: "INVALID_CREDENTIALS" });
        }

        // Generate JWT token including `role`
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: "admin" }, // Include role
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during admin login:", error.message);
        res.status(500).json({ message: "Server error occurred. Please try again later.", errorCode: "SERVER_ERROR" });
    }
};

