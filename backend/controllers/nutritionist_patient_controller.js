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

function processMealPlanData(rawPrediction) {
    const processedPlan = {};
    
    Object.keys(rawPrediction).forEach(date => {
      const dayData = rawPrediction[date];
      const day = dayData.day;
      
      if (!processedPlan[day]) {
        processedPlan[day] = {
          date: dayData.date,
          total_calories: dayData.total_calories
        };
      }
      
      // Add each meal with full details
      Object.keys(dayData.meals).forEach(mealType => {
        const meal = dayData.meals[mealType];
        
        // Add main meal
        processedPlan[day][mealType] = meal.title;
        
        // Add meal details
        processedPlan[day][`${mealType}_details`] = {
          calories: meal.calories,
          servings: meal.servings,
          total_calories: meal.total_calories
        };
        
        // Add components
        processedPlan[day][`${mealType}_rice`] = {
          title: meal.rice.title,
          servings: meal.rice.servings,
          calories: meal.rice.calories,
          total_calories: meal.rice.total_calories
        };
        
        processedPlan[day][`${mealType}_side_dish`] = {
          title: meal.side_dish.title,
          servings: meal.side_dish.servings, 
          calories: meal.side_dish.calories,
          total_calories: meal.side_dish.total_calories
        };
        
        processedPlan[day][`${mealType}_drink`] = {
          title: meal.drink.title,
          servings: meal.drink.servings,
          calories: meal.drink.calories,
          total_calories: meal.drink.total_calories
        };
        
        processedPlan[day][`${mealType}_meal_total`] = meal.meal_total_calories;
      });
    });
    
    return processedPlan;
}

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
        if (parseInt(age) < 18) {
            return res.status(400).json({ 
                error: 'Age must be at least 18 years to generate a meal plan.' 
            });
        }
        
        // Calculate BMR and TDEE
        const BMR = calculateBMR(weight, height, age, gender);
        const TDEE = calculateTDEE(BMR, activity_level);
        
        // Parse preference string to boolean values
        const dietaryPreferences = {
            TDEE: TDEE,
            vegetarian: preference.includes('vegetarian'),
            low_purine: preference.includes('low_purine'),
            low_fat: preference.includes('low_fat') || preference.includes('low-fat'),
            low_sodium: preference.includes('low_sodium') || preference.includes('low-sodium'),
            lactose_free: preference.includes('lactose_free') || preference.includes('lactose-free'),
            peanut_allergy: restrictions.includes('peanut'),
            shellfish_allergy: restrictions.includes('shellfish'),
            fish_allergy: restrictions.includes('fish'),
            halal_or_kosher: preference.includes('halal') || preference.includes('kosher')
        };
        
        // Get prediction from Flask API
        const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';
        const response = await axios.post(`${ML_API_URL}/predict`, dietaryPreferences);

        const rawPrediction = response.data.predicted_meal_plan;

        let prediction;
        try {
            prediction = processMealPlanData(rawPrediction);
        } catch (error) {
            console.error("Error processing meal plan data:", error);
            return res.status(500).json({ error: "Error processing meal plan data" });
        }

        const BMI = (weight / ((height / 100) ** 2)).toFixed(2);

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

        // Add TDEE validation
        if (TDEE < 500) {
            return res.status(400).json({ 
                error: 'TDEE too low. Cannot generate meal plan for TDEE below 500 calories.' 
            });
        }
        
        // Update TDEE in patient data
        patient.TDEE = TDEE;

        // Format dietary preferences for the new API structure
        const dietaryPreferences = {
            TDEE: TDEE,
            vegetarian: preference.includes('vegetarian'),
            low_purine: preference.includes('low_purine'),
            low_fat: preference.includes('low_fat') || preference.includes('low-fat'),
            low_sodium: preference.includes('low_sodium') || preference.includes('low-sodium'),
            lactose_free: preference.includes('lactose_free') || preference.includes('lactose-free'),
            peanut_allergy: restrictions.includes('peanut'),
            shellfish_allergy: restrictions.includes('shellfish'),
            fish_allergy: restrictions.includes('fish'),
            halal_or_kosher: preference.includes('halal') || preference.includes('kosher')
        };

        const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';
        const response = await axios.post(`${ML_API_URL}/predict`, dietaryPreferences);
        
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