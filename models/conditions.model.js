const mongoose = require("mongoose");

const conditionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    treatments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Treatments",
        required: true
    }],
    overview:{
        type:String
    }
}, { timestamps: true });

module.exports = mongoose.model('Conditions', conditionsSchema);
