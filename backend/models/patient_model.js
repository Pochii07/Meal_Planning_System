const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MealSchema = new Schema({
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' }
});

const ProgressSchema = new Schema({
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false }
});

const UserDetailsSchema = new Schema({
    age: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    BMI: {
        type: Number,
    },
    BMR: {
        type: Number,
    },
    TDEE: {
        type: Number,
    },
    activity_level: {
        type: Number,
        required: true
    },
    preference: {
        type: String,
        required: true
    },
    restrictions: {
        type: String,
        required: true
    },
    prediction: {
        Monday: MealSchema,
        Tuesday: MealSchema,
        Wednesday: MealSchema,
        Thursday: MealSchema,
        Friday: MealSchema,
        Saturday: MealSchema,
        Sunday: MealSchema
    },
    progress: {
        Monday: ProgressSchema,
        Tuesday: ProgressSchema,
        Wednesday: ProgressSchema,
        Thursday: ProgressSchema,
        Friday: ProgressSchema,
        Saturday: ProgressSchema,
        Sunday: ProgressSchema
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('PatientDetails', UserDetailsSchema)
