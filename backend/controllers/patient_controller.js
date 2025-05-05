const Patient = require('../models/patient_model');
const NutritionistPatient = require('../models/nutritionist_patient_model');
const mongoose = require('mongoose')
const axios = require('axios')
const { verify } = require('crypto')

// Add this at the top of patient_controller.js
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

// get all patients
const getAllPatients = async (req, res) => {
    const allPatients = await Patient.find({}).sort({createdAt: - 1})

    const formattedPatients = allPatients.map(patient => {
        const { progress, ...details } = patient._doc 
        return { ...details, progress } 
    })

    res.status(200).json(formattedPatients)
}

// get patient
const getPatient = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No patient found' })
    }

    try {
        const patient = await Patient.findById(id)
        if (!patient) {
            return res.status(404).json({ error: 'No patient found' })
        }

        const { progress, ...details } = patient._doc
        res.status(200).json({ ...details, progress })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// for calculation of BMI
const calculateBMI = (weight,height) =>{
    return (weight / ((height / 100) ** 2)).toFixed(2)
}

const calculateBMR = (weight,height,age) => {
    if (gender = ("M")) {
        return ((10*(weight)+(6.25*(height))-(5*(age)))+5)
    }

    else if (gender = ("F")){
        return ((10*(weight)+(6.25*(height))-(5*(age)))+5-161)
    }
}

const calculateTDEE = (BMR, activity_level) => {
    return (BMR * activity_level)
}


// new patient
const newPatient = async (req, res) => {
    const { age, height, weight, gender, activity_level, preference, restrictions } = req.body;
    const userId = req.userId;

    try {
        // Get prediction from Flask API
        const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';
        console.log('Sending to ML API:', {
            age, height, weight, gender, 
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level
        });
        
        // Convert numeric activity level to string format (like in nutritionist controller)
        let activityLevelString;
        if (activity_level <= 1.2) activityLevelString = 'sedentary';
        else if (activity_level <= 1.375) activityLevelString = 'light';
        else if (activity_level <= 1.55) activityLevelString = 'moderate';
        else if (activity_level <= 1.725) activityLevelString = 'active';
        else activityLevelString = 'very active';
        
        const response = await axios.post(`${ML_API_URL}/predict_meal_plan`, {
            age,
            height,
            weight,
            gender,
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level: activityLevelString // Send string instead of number
        });

        console.log('Full ML API response:', response.data);

        const rawPrediction = response.data.predicted_meal_plan;
        
        let prediction;
        try {
            prediction = processMealPlanData(rawPrediction);
        } catch (error) {
            console.error("Error processing meal plan data:", error);
            return res.status(500).json({ error: "Error processing meal plan data" });
        }

        const BMI = calculateBMI(weight, height);
        const BMR = calculateBMR(weight, height, age);
        const TDEE = calculateTDEE(BMR, activity_level);

        const new_patient = await Patient.create({
            age,
            height,
            weight,
            gender,
            BMI,
            BMR,
            TDEE,
            activity_level,
            preference,
            restrictions,
            prediction,
            userId
        });

        res.status(200).json(new_patient);
    } catch (error) {
        console.error("ML API Error:", error.response?.data || error.message);
        
        let errorMessage = "Failed to generate meal plan";
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }
        
        res.status(400).json({ error: errorMessage });
    }
};

// get user's meal plans
const getUserMealPlans = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Finding meal plans for user:", userId);

        const mealPlan = await Patient.findOne({ userId: String(userId) })
            .sort({ createdAt: -1 })
            .select('prediction progress skippedMeals mealNotes _id TDEE BMI')
            .lean();

        if (!mealPlan) {
            return res.status(404).json({ error: 'No meal plan found' });
        }

        console.log("Found meal plan:", mealPlan);
        res.status(200).json([mealPlan]);
    } catch (error) {
        console.error("Error finding meal plans:", error);
        res.status(400).json({ error: error.message });
    }
};

// delete patient
const deletePatient = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'no patient found'})
    }

    const removePatient = await Patient.findByIdAndDelete(id)

    if (!removePatient) {
        return res.status(404).json({error: 'No patient found'})
    }

    res.status(200).json(removePatient)
}

// update patient details
const updatePatient = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'no patient found'})
    }

    const updatePatientDetails = await Patient.findByIdAndUpdate(id,{
        ...req.body
    })

    res.status(200).json(updatePatientDetails)
}


// Update meal progress
const updateMealProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, value } = req.body;

        // Find the patient and update the specific meal progress
        const updatedPatient = await Patient.findByIdAndUpdate(
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

// Update meal notes and skipped status
const updateMealNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, meal, note, skipped } = req.body;
        
        // Update both the note and the skipped status
        const updatedPatient = await Patient.findByIdAndUpdate(
            id,
            { 
                $set: {
                    [`mealNotes.${day}.${meal}`]: note,
                    [`skippedMeals.${day}.${meal}`]: skipped
                }
            },
            { new: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.status(200).json({
            success: true,
            mealNotes: updatedPatient.mealNotes,
            skippedMeals: updatedPatient.skippedMeals
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get weekly progress
const getWeeklyProgress = async (req, res) => {
    const { id } = req.params

    try {
        const patient = await Patient.findById(id)
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' })
        }

        res.status(200).json(patient.progress)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const generateGuestMealPlan = async (req, res) => {
    const {age, height, weight, gender, activity_level, preference, restrictions} = req.body;

    try {
        // Convert numeric activity level to string format
        let activityLevelString;
        if (activity_level <= 1.2) activityLevelString = 'sedentary';
        else if (activity_level <= 1.375) activityLevelString = 'light';
        else if (activity_level <= 1.55) activityLevelString = 'moderate';
        else if (activity_level <= 1.725) activityLevelString = 'active';
        else activityLevelString = 'very active';
        
        // Call Flask API for prediction
        const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5000';
        const response = await axios.post(`${ML_API_URL}/predict_meal_plan`, {
            age,
            height, 
            weight,
            gender,
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level: activityLevelString
        });
        
        console.log('Full ML API response:', response.data);
        const rawPrediction = response.data.predicted_meal_plan;
        
        let prediction;
        try {
            prediction = processMealPlanData(rawPrediction);
        } catch (error) {
            console.error("Error processing meal plan data:", error);
            return res.status(500).json({ error: "Error processing meal plan data" });
        }

        // Only return the prediction without saving to database
        res.status(200).json({ prediction });
    } catch (error) {
        console.error("ML API Error:", error.response?.data || error.message);
        
        let errorMessage = "Failed to generate meal plan";
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }
        
        res.status(400).json({ error: errorMessage });
    }
};

// Verify if an access code is valid
const verifyAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.body;
        
        // Find the patient with this access code
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            return res.status(404).json({ error: 'Invalid access code' });
        }
        
        res.status(200).json({ valid: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get patient data using access code
const getPatientDataByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.params;
        
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            return res.status(404).json({ error: 'Invalid access code' });
        }
        
        res.status(200).json({
            _id: patient._id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            prediction: patient.prediction,
            progress: patient.progress,
            skippedMeals: patient.skippedMeals,
            mealNotes: patient.mealNotes,
            nutritionistNotes: patient.nutritionistNotes,
            mealAddons: patient.mealAddons // Make sure this line is included
        });
        
    } catch (error) {
        console.error('Error getting patient data by access code:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update progress by access code
const updateProgressByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.params;
        const { day, meal, value } = req.body;
        
        // Find and update the patient's progress
        const patient = await NutritionistPatient.findOneAndUpdate(
            { accessCode },
            { $set: { [`progress.${day}.${meal}`]: value } },
            { new: true }
        );
        
        if (!patient) {
            return res.status(404).json({ error: 'Invalid access code' });
        }
        
        res.status(200).json({ progress: patient.progress });
    } catch (error) {
        console.error('Error updating progress by access code:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update meal status (skipped) by access code
const updateMealStatusByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.params;
        const { day, meal, note, skipped } = req.body;
        
        console.log(`Updating meal status for accessCode ${accessCode}: day=${day}, meal=${meal}, skipped=${skipped}`);
        
        // Find patient by access code
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            console.log(`No patient found with accessCode ${accessCode}`);
            return res.status(404).json({ error: 'Invalid access code' });
        }
        
        // Initialize objects if they don't exist
        if (!patient.skippedMeals) patient.skippedMeals = {};
        if (!patient.skippedMeals[day]) patient.skippedMeals[day] = {};
        
        if (!patient.mealNotes) patient.mealNotes = {};
        if (!patient.mealNotes[day]) patient.mealNotes[day] = {};
        
        // Update the skipped status and note
        patient.skippedMeals[day][meal] = skipped;
        if (skipped) {
            patient.mealNotes[day][meal] = note;
        }
        
        // Save the document
        await patient.save();
        
        // Return the updated objects
        res.status(200).json({
            success: true,
            skippedMeals: patient.skippedMeals,
            mealNotes: patient.mealNotes
        });
    } catch (error) {
        console.error('Error updating meal status by access code:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update meal notes by access code
const updateMealNotesByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.params;
        const { day, meal, note, skipped } = req.body;
        
        console.log(`Updating meal note for accessCode ${accessCode}: day=${day}, meal=${meal}, note=${note}`);
        
        // Find patient by access code
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            return res.status(404).json({ error: 'Invalid access code' });
        }
        
        // Initialize objects if they don't exist
        if (!patient.mealNotes) patient.mealNotes = {};
        if (!patient.mealNotes[day]) patient.mealNotes[day] = {};
        
        // Update the note
        patient.mealNotes[day][meal] = note;
        
        // Save the document
        await patient.save();
        
        res.status(200).json({
            success: true,
            mealNotes: patient.mealNotes
        });
    } catch (error) {
        console.error('Error updating meal notes by access code:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update addon status by access code
const updateAddonStatusByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.params;
        const { day, meal, addonIndex, completed, skipped } = req.body;
        
        console.log(`Updating addon status for accessCode ${accessCode}: day=${day}, meal=${meal}, addonIndex=${addonIndex}`);
        
        // Find patient by access code
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            return res.status(404).json({ error: 'Invalid access code' });
        }
        
        if (!patient.mealAddons?.[day]?.[meal]?.[addonIndex]) {
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
        console.error('Error updating addon status by access code:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllPatients,
    getPatient,
    newPatient,
    deletePatient,
    updatePatient,
    updateMealProgress,
    updateMealNotes,
    getWeeklyProgress,
    getUserMealPlans,
    generateGuestMealPlan,
    verifyAccessCode,
    getPatientDataByAccessCode,
    updateProgressByAccessCode,
    updateMealStatusByAccessCode,
    updateMealNotesByAccessCode,
    updateAddonStatusByAccessCode
};

