const { PhoneNumber } = require("libphonenumber-js");
const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
    hospitalName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    conditions:{
        type:mongoose.Schema.Types.ObjectId,ref:"Conditions",required:true
    },
    overview:{
        type:String
    },
    timings:{
        type:String
    },
    specialitiesTreatments:[
        {
            websiteURL:{type:String},
            phoneNumber:{type:Number}
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
