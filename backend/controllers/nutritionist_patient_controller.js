const NutritionistPatient = require('../models/nutritionist_patient_model')
const mongoose = require('mongoose')
const axios = require('axios')

const calculateBMR = (weight, height, age, gender) => {
    if (gender.toUpperCase() === "M") {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
};

const calculateTDEE = (BMR, activity_level) => {
    return (BMR * activity_level);
};

// Get all patients for a nutritionist
const getNutritionistPatients = async (req, res) => {
    try {
        const nutritionistId = req.userId;
        const patients = await NutritionistPatient.find({ nutritionistId })
            .sort({ createdAt: -1 });
        res.status(200).json(patients);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Get single patient
const getNutritionistPatient = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        const patient = await NutritionistPatient.findById(id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Create new patient
const createNutritionistPatient = async (req, res) => {
    const { 
        firstName, 
        lastName,
        age, 
        height, 
        weight, 
        gender, 
        activity_level, 
        preference, 
        restrictions 
    } = req.body;
    
    const nutritionistId = req.userId;

    try {
        // Get prediction from Flask API
        const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';
        const response = await axios.post(`${ML_API_URL}/predict_meal_plan`, {
            age,
            height,
            weight,
            gender,
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level
        });

        const BMI = (weight / ((height / 100) ** 2)).toFixed(2);
        
        // Calculate BMR and TDEE
        const BMR = calculateBMR(weight, height, age, gender);
        const TDEE = calculateTDEE(BMR, activity_level);

        const rawPrediction = response.data.predicted_meal_plan;
        let prediction = {};

        try {
            if (typeof rawPrediction === 'string') {
                prediction = JSON.parse(rawPrediction.replace(/'/g, '"'));
            } else if (typeof rawPrediction === 'object') {
                prediction = rawPrediction;
            }
            
            // Transform the prediction to include dates
            const transformedPrediction = {};
            for (const [day, data] of Object.entries(prediction)) {
                transformedPrediction[day] = {
                    breakfast: data.meals.breakfast,
                    lunch: data.meals.lunch,
                    dinner: data.meals.dinner,
                    date: new Date(data.date)
                };
            }
            
            prediction = transformedPrediction;
        } catch (parseError) {
            console.error('Error parsing prediction:', parseError);
        }

        // Initialize progress structure
        const progress = {
            Monday: { breakfast: false, lunch: false, dinner: false },
            Tuesday: { breakfast: false, lunch: false, dinner: false },
            Wednesday: { breakfast: false, lunch: false, dinner: false },
            Thursday: { breakfast: false, lunch: false, dinner: false },
            Friday: { breakfast: false, lunch: false, dinner: false },
            Saturday: { breakfast: false, lunch: false, dinner: false },
            Sunday: { breakfast: false, lunch: false, dinner: false }
        };

        const newPatient = await NutritionistPatient.create({
            firstName,
            lastName,
            age,
            height,
            weight,
            gender,
            BMI,
            TDEE, // Add TDEE here
            activity_level,
            preference,
            restrictions,
            prediction,
            progress,
            nutritionistId
        });

        res.status(200).json(newPatient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Update patient
const updateNutritionistPatient = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        const patient = await NutritionistPatient.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        );
        res.status(200).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Delete patient
const deleteNutritionistPatient = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        const patient = await NutritionistPatient.findByIdAndDelete(id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const updatePatientProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, value } = req.body;

        const updatedPatient = await NutritionistPatient.findByIdAndUpdate(
            id,
            { 
                $set: {
                    [`progress.${day}.${meal}`]: value
                }
            },
            { new: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.status(200).json({
            success: true,
            progress: updatedPatient.progress
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const regenerateMealPlan = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        // Find the patient
        const patient = await NutritionistPatient.findById(id);
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Before generating the new meal plan, save the current one to history
        if (patient.prediction && Object.keys(patient.prediction).length > 0) {
            // Initialize mealPlanHistory array if it doesn't exist
            if (!patient.mealPlanHistory) {
                patient.mealPlanHistory = [];
            }
            
            // Push the current meal plan to history
            patient.mealPlanHistory.push({
                date: new Date(),
                prediction: patient.prediction,
                progress: patient.progress || {},
                skippedMeals: patient.skippedMeals || {},
                mealNotes: patient.mealNotes || {},
                nutritionistNotes: patient.nutritionistNotes || {} // Add this line
            });
        }
        
        // Extract patient details needed for meal plan generation
        const { 
            age, 
            height, 
            weight, 
            gender, 
            activity_level, 
            preference, 
            restrictions 
        } = patient;

        // Recalculate BMR and TDEE to ensure they're up to date
        const BMR = calculateBMR(weight, height, age, gender);
        const TDEE = calculateTDEE(BMR, activity_level);
        
        // Update TDEE in patient data
        patient.TDEE = TDEE;

        // Convert numeric activity level to string format
        let activityLevelString;
        if (activity_level <= 1.2) activityLevelString = 'sedentary';
        else if (activity_level <= 1.375) activityLevelString = 'light';
        else if (activity_level <= 1.55) activityLevelString = 'moderate';
        else if (activity_level <= 1.725) activityLevelString = 'active';
        else activityLevelString = 'very active';

        const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';
        const response = await axios.post(`${ML_API_URL}/predict_meal_plan`, {
            age,
            height,
            weight,
            gender,
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level: activityLevelString // Send string instead of number
        });
        
        // Parse the prediction
        const rawPrediction = response.data.predicted_meal_plan;
        let prediction = {};
        
        try {
            if (typeof rawPrediction === 'string') {
                prediction = JSON.parse(rawPrediction.replace(/'/g, '"'));
            } else if (typeof rawPrediction === 'object') {
                prediction = rawPrediction;
            }
            
            // Transform the prediction to include dates
            const transformedPrediction = {};
            for (const [day, data] of Object.entries(prediction)) {
                transformedPrediction[day] = {
                    breakfast: data.meals.breakfast,
                    lunch: data.meals.lunch,
                    dinner: data.meals.dinner,
                    date: new Date(data.date)
                };
            }
            
            prediction = transformedPrediction;
        } catch (parseError) {
            console.error('Error parsing prediction:', parseError);
        }
        
        // Reset progress, skipped meals, meal notes, and nutritionist notes
        const progress = {
            Monday: { breakfast: false, lunch: false, dinner: false },
            Tuesday: { breakfast: false, lunch: false, dinner: false },
            Wednesday: { breakfast: false, lunch: false, dinner: false },
            Thursday: { breakfast: false, lunch: false, dinner: false },
            Friday: { breakfast: false, lunch: false, dinner: false },
            Saturday: { breakfast: false, lunch: false, dinner: false },
            Sunday: { breakfast: false, lunch: false, dinner: false }
        };
        
        patient.prediction = prediction;
        patient.progress = progress;
        patient.skippedMeals = {};
        patient.mealNotes = {};
        patient.nutritionistNotes = {};
        
        await patient.save();
        
        res.status(200).json({
            success: true,
            prediction: patient.prediction,
            progress: patient.progress,
            skippedMeals: patient.skippedMeals,
            mealNotes: patient.mealNotes,
            nutritionistNotes: patient.nutritionistNotes,
            TDEE: patient.TDEE 
        });
    } catch (error) {
        console.error('Error regenerating meal plan:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get meal plan history for a patient
const getMealPlanHistory = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        const patient = await NutritionistPatient.findById(id);
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.status(200).json(patient.mealPlanHistory || []);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateNutritionistNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, note } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Initialize objects if they don't exist
        const updateQuery = {
            $set: {
                [`nutritionistNotes.${day}.${meal}`]: note
            }
        };
        
        const updatedPatient = await NutritionistPatient.findByIdAndUpdate(
            id,
            updateQuery,
            { new: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.status(200).json({
            success: true,
            nutritionistNotes: updatedPatient.nutritionistNotes
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getNutritionistPatients,
    getNutritionistPatient,
    createNutritionistPatient,
    updateNutritionistPatient,
    deleteNutritionistPatient,
    updatePatientProgress,
    regenerateMealPlan,
    getMealPlanHistory,
    updateNutritionistNotes
}