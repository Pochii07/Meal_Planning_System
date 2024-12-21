const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserDetailsSchema = new Schema({
    age: {
        type:Number,
        required: true
    },
    height: {
        type:Number,
        required: true
    },
    weight: {
        type:Number,
        required: true
    },
    BMI:{
        type:Number,    // automatically calculated
    },
    activity_level: {
        type:Number,
        required: true
    },
    preference: {
        type:String,
        required: true
    },
    restrictions: {
        type:String,
        required: true
    }
    
}, { timestamps: true})

module.exports = mongoose.model('PatientDetails',UserDetailsSchema)

