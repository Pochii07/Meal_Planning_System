const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MealSchema = new Schema({
    // Main meal names
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
    date: { type: Date },
    
    // Meal details - calories information
    breakfast_details: {
        calories: { type: Number, default: 0 },
        servings: { type: Number, default: 1 },
        total_calories: { type: Number, default: 0 }
    },
    lunch_details: {
        calories: { type: Number, default: 0 },
        servings: { type: Number, default: 1 },
        total_calories: { type: Number, default: 0 }
    },
    dinner_details: {
        calories: { type: Number, default: 0 },
        servings: { type: Number, default: 1 },
        total_calories: { type: Number, default: 0 }
    },
    
    // Rice components
    breakfast_rice: {
        title: { type: String, default: 'Rice' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    lunch_rice: {
        title: { type: String, default: 'Rice' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    dinner_rice: {
        title: { type: String, default: 'Rice' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    
    // Side dish components
    breakfast_side_dish: {
        title: { type: String, default: '' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    lunch_side_dish: {
        title: { type: String, default: '' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    dinner_side_dish: {
        title: { type: String, default: '' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    
    // Drink components
    breakfast_drink: {
        title: { type: String, default: '' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    lunch_drink: {
        title: { type: String, default: '' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    dinner_drink: {
        title: { type: String, default: '' },
        servings: { type: Number, default: 1 },
        calories: { type: Number, default: 0 },
        total_calories: { type: Number, default: 0 }
    },
    
    // Total meal calories
    breakfast_meal_total: { type: Number, default: 0 },
    lunch_meal_total: { type: Number, default: 0 },
    dinner_meal_total: { type: Number, default: 0 },
    
    // Daily total calories
    total_calories: { type: Number, default: 0 }
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


const MealAddonsSchema = new Schema({
    breakfast: [{ 
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        skipped: { type: Boolean, default: false }
    }],
    lunch: [{ 
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        skipped: { type: Boolean, default: false }
    }],
    dinner: [{ 
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        skipped: { type: Boolean, default: false }
    }]
});


const MealPlanHistorySchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    prediction: {
        type: Schema.Types.Mixed,
        required: true
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

    nutritionistNotes: {
        Monday: MealNotesSchema,
        Tuesday: MealNotesSchema,
        Wednesday: MealNotesSchema,
        Thursday: MealNotesSchema,
        Friday: MealNotesSchema,
        Saturday: MealNotesSchema,
        Sunday: MealNotesSchema
    }
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
    TDEE: {
        type:Number,
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
    nutritionistNotes: {
        Monday: MealNotesSchema,
        Tuesday: MealNotesSchema,
        Wednesday: MealNotesSchema,
        Thursday: MealNotesSchema,
        Friday: MealNotesSchema,
        Saturday: MealNotesSchema,
        Sunday: MealNotesSchema
    },
    mealAddons: {
        Monday: MealAddonsSchema,
        Tuesday: MealAddonsSchema,
        Wednesday: MealAddonsSchema,
        Thursday: MealAddonsSchema,
        Friday: MealAddonsSchema,
        Saturday: MealAddonsSchema,
        Sunday: MealAddonsSchema
    },
    mealPlanHistory: [MealPlanHistorySchema],
    nutritionistId: {
        type: String,
        ref: 'User',
        required: true
    },
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('NutritionistPatient', NutritionistPatientSchema);