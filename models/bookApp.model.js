const mongoose = require('mongoose');

const BookAppSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true
    },
    relation: {
        type: String,
        required: true
    },
    treatmentCondition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conditions",
        required: true
    },
    doctorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        default:null,
        required: false
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    usedRefferal:{
        type:String,
        default:null,
        required: false
    },
    createdBy: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('BookApp', BookAppSchema);
