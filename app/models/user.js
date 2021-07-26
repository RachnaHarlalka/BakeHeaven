const mongoose = require('mongoose')
var passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema

const userScheme = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: { type: String, default: 'customer', required: true }
}, { timestamps: true })

userScheme.plugin(passportLocalMongoose)

module.exports = mongoose.model('user', userScheme)