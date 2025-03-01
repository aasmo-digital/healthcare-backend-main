const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    otp: {
        type: String,
    },
    city: {
        type:mongoose.Schema.Types.ObjectId,ref:"City",
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role:{
        type:String,
        default:"user"
    }
},{timestamps:true})
module.exports = mongoose.model('User', userSchema);