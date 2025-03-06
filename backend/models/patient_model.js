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
    gender:{
        type:String,
        required: true
    },
    BMI:{
        type:Number,    // automatically calculated
    },
    BMR:{
        type:Number,    // automatically calculated
    },
    TDEE:{
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
    },
    progress: {
        type: Map, // Map to track meals for each day
        of: {
            breakfast: { type: Boolean, default: false },
            lunch: { type: Boolean, default: false },
            dinner: { type: Boolean, default: false }
        },
        default: {
            Sunday: { breakfast: false, lunch: false, dinner: false },
            Monday: { breakfast: false, lunch: false, dinner: false },
            Tuesday: { breakfast: false, lunch: false, dinner: false },
            Wednesday: { breakfast: false, lunch: false, dinner: false },
            Thursday: { breakfast: false, lunch: false, dinner: false },
            Friday: { breakfast: false, lunch: false, dinner: false },
            Saturday: { breakfast: false, lunch: false, dinner: false },
        } 
    },
    prediction: {
        type: String, // Add a new field for the prediction result
    }
},   {timestamps: true})

module.exports = mongoose.model('PatientDetails',UserDetailsSchema)
