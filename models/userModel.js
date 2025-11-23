const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required: true,
        unique: true
    },
    fullName : {
        type : String,
        required : true
    },
    password: {
        type : String,
        required: true,
        minlength: 6
    },
    profileImage : {
        type : String,
        default : ''
    },
    bio : {
        type : String,
    },
}, {timestamps : true});


const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;