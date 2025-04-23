// backend/models/nutritionist_patient_model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const SkippedMealsSchema = new Schema({
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false }
});

const MealNotesSchema = new Schema({
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' }
});

const NutritionistPatientSchema = new Schema({

    accessCode: {
        type: String,
        default: () => Math.floor(100000 + Math.random() * 900000).toString()
    },

    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
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
    skippedMeals: {
        Monday: SkippedMealsSchema,
        Tuesday: SkippedMealsSchema,
        Wednesday: SkippedMealsSchema,
        Thursday: SkippedMealsSchema,
        Friday: SkippedMealsSchema,
        Saturday: SkippedMealsSchema,
        Sunday: SkippedMealsSchema
    },
    mealNotes: {
        Monday: MealNotesSchema,
        Tuesday: MealNotesSchema,
        Wednesday: MealNotesSchema,
        Thursday: MealNotesSchema,
        Friday: MealNotesSchema,
        Saturday: MealNotesSchema,
        Sunday: MealNotesSchema
    },
    nutritionistId: {
        type: String,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('NutritionistPatient', NutritionistPatientSchema);