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

const processMealPlanData = (rawPrediction) => {
    let processedPrediction = {};
    
    try {
        // Parse prediction if it's a string
        let prediction = rawPrediction;
        if (typeof rawPrediction === 'string') {
            prediction = JSON.parse(rawPrediction.replace(/'/g, '"'));
        }

        // Loop through each day in the prediction
        for (const day in prediction) {
            if (prediction.hasOwnProperty(day)) {
                const dayData = prediction[day];
                
                // Create basic meal plan structure for compatibility
                processedPrediction[day] = {
                    date: dayData.date,
                    breakfast: dayData.breakfast || dayData.meals?.breakfast?.title,
                    lunch: dayData.lunch || dayData.meals?.lunch?.title,
                    dinner: dayData.dinner || dayData.meals?.dinner?.title,
                    
                    // Store detailed meal information
                    breakfast_details: {
                        calories: dayData.meals?.breakfast?.calories || 0,
                        servings: dayData.meals?.breakfast?.servings || 1,
                        total_calories: dayData.meals?.breakfast?.total_calories || 0
                    },
                    lunch_details: {
                        calories: dayData.meals?.lunch?.calories || 0,
                        servings: dayData.meals?.lunch?.servings || 1,
                        total_calories: dayData.meals?.lunch?.total_calories || 0
                    },
                    dinner_details: {
                        calories: dayData.meals?.dinner?.calories || 0,
                        servings: dayData.meals?.dinner?.servings || 1,
                        total_calories: dayData.meals?.dinner?.total_calories || 0
                    }
                };
            }
        }
        
        return processedPrediction;
    } catch (error) {
        console.error("Error processing meal plan data:", error);
        throw new Error("Error processing meal plan data");
    }
};

// Get all patients for a nutritionist
const getNutritionistPatients = async (req, res) => {
    try {
        const nutritionistId = req.userId;
        const patients = await NutritionistPatient.find({
            nutritionistId,
            $or: [
              { archived: false },
              { archived: { $exists: false } } 
            ]
            }).sort({ createdAt: -1 });
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

        const rawPrediction = response.data.predicted_meal_plan;

        let prediction;
        try {
            prediction = processMealPlanData(rawPrediction);
        } catch (error) {
            console.error("Error processing meal plan data:", error);
            return res.status(500).json({ error: "Error processing meal plan data" });
        }

        const BMI = (weight / ((height / 100) ** 2)).toFixed(2);
        
        // Calculate BMR and TDEE
        const BMR = calculateBMR(weight, height, age, gender);
        const TDEE = calculateTDEE(BMR, activity_level);

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
            TDEE,
            activity_level,
            preference,
            restrictions,
            prediction,
            progress,
            nutritionistId
        });

        res.status(200).json(newPatient);
    } catch (error) {
        console.error("ML API Error:", error.response?.data || error.message);
        
        let errorMessage = "Failed to generate meal plan";
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }
        
        return res.status(400).json({ error: errorMessage });
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
                nutritionistNotes: patient.nutritionistNotes || {},
                mealAddons: patient.mealAddons || {} 
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

        let prediction;
        try {
            prediction = processMealPlanData(rawPrediction);
        } catch (error) {
            console.error("Error processing meal plan data:", error);
            return res.status(500).json({ error: "Error processing meal plan data" });
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
        patient.mealAddons = {}; 

        await patient.save();    
        res.status(200).json({
            success: true,
            prediction: patient.prediction,
            progress: patient.progress,
            skippedMeals: patient.skippedMeals,
            mealNotes: patient.mealNotes,
            nutritionistNotes: patient.nutritionistNotes,
            mealAddons: patient.mealAddons,
            TDEE: patient.TDEE 
        });
    } catch (error) {
        console.error("ML API Error:", error.response?.data || error.message);
        
        let errorMessage = "Failed to generate meal plan";
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }
        
        return res.status(400).json({ error: errorMessage });
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

const addMealAddon = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, addonText } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const patient = await NutritionistPatient.findById(id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Initialize mealAddons if it doesn't exist
        if (!patient.mealAddons) {
            patient.mealAddons = {};
        }
        if (!patient.mealAddons[day]) {
            patient.mealAddons[day] = {};
        }
        if (!patient.mealAddons[day][meal]) {
            patient.mealAddons[day][meal] = [];
        }

        // Add the new addon
        patient.mealAddons[day][meal].push({
            text: addonText,
            completed: false,
            skipped: false
        });

        await patient.save();

        res.status(200).json({ 
            success: true, 
            mealAddons: patient.mealAddons
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateAddonStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, addonIndex, completed, skipped } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const patient = await NutritionistPatient.findById(id);
        
        if (!patient || !patient.mealAddons?.[day]?.[meal]?.[addonIndex]) {
            return res.status(404).json({ error: 'Addon not found' });
        }

        // Update the addon status
        if (completed !== undefined) {
            patient.mealAddons[day][meal][addonIndex].completed = completed;
        }
        
        if (skipped !== undefined) {
            patient.mealAddons[day][meal][addonIndex].skipped = skipped;
        }

        await patient.save();

        res.status(200).json({ 
            success: true, 
            mealAddons: patient.mealAddons
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const removeMealAddon = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, addonIndex } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const patient = await NutritionistPatient.findById(id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        if (!patient.mealAddons?.[day]?.[meal] || addonIndex >= patient.mealAddons[day][meal].length) {
            return res.status(404).json({ error: 'Addon not found' });
        }

        // Remove the addon at the specified index
        patient.mealAddons[day][meal].splice(addonIndex, 1);

        await patient.save();

        res.status(200).json({ 
            success: true, 
            mealAddons: patient.mealAddons
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const archiveNutritionistPatient = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        const patient = await NutritionistPatient.findByIdAndUpdate(
            id,
            { 
                archived: true,
                archivedAt: new Date()
            },
            { new: true }
        );
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.status(200).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get archived patients
const getArchivedPatients = async (req, res) => {
    try {
        const nutritionistId = req.userId;
        const archivedPatients = await NutritionistPatient.find({ 
            nutritionistId,
            archived: true 
        }).sort({ archivedAt: -1 });
        
        res.status(200).json(archivedPatients);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Restore patient from archive
const restoreNutritionistPatient = async (req, res) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    try {
        const patient = await NutritionistPatient.findByIdAndUpdate(
            id,
            { 
                archived: false,
                archivedAt: null
            },
            { new: true }
        );
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.status(200).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {
    getNutritionistPatients,
    getNutritionistPatient,
    createNutritionistPatient,
    updateNutritionistPatient,
    deleteNutritionistPatient,
    updatePatientProgress,
    regenerateMealPlan,
    getMealPlanHistory,
    updateNutritionistNotes,
    addMealAddon,
    updateAddonStatus,
    removeMealAddon,
    archiveNutritionistPatient,
    getArchivedPatients,
    restoreNutritionistPatient
}