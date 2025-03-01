const mongoose = require("mongoose");

const treatmentsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    treatmentDuration: [{
        durationMin: { type: String },
        durationMix: { type: String },
    }],
    treatmentCost:[ {
        costMin: { type: Number },
        costMix: { type: Number },
    }],
    overview:{
        type:String
    }
}, { timestamps: true });

module.exports = mongoose.model('Treatments', treatmentsSchema);
