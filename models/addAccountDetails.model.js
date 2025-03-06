const mongoose = require('mongoose');

const accountDetailsSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
    upi: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'createdByModel' // Dynamic reference to either 'User' or 'Doctor'
    },
    createdByModel: {
        type: String,
        required: true,
        enum: ['User', 'Doctor'] // Specifies the possible models
    }
}, { timestamps: true });

module.exports = mongoose.model('AccountDetails', accountDetailsSchema);
