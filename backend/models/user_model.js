const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true     
    },
    sex: {
        type: String,
        role: {
            type: String,
            enum: ['male', 'female'],
            required: true 
        },
        required: true 
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordTokenExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, {
    timestamps: true,
    auto: false
})

module.exports = mongoose.model('User', UserSchema);
