const mongoose = require("mongoose");
const referSchema = new mongoose.Schema({
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
        required: true
    },
    refferalCode:{
        type: String,
        required: true
    }
},{timestamps:true})
module.exports = mongoose.model('DoctorRefferalHospital', referSchema);