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
        const BMI = calculateBMI(weight, height);
        const BMR = calculateBMR(weight, height, age);
        const TDEE = calculateTDEE(BMR, activity_level);
        
        // Add TDEE validation
        if (TDEE < 500) {
            return res.status(400).json({ 
                error: 'TDEE too low. Cannot generate meal plan for TDEE below 500 calories.' 
            });
        }
        
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

// Get all meal plans for a user
const getUserMealPlansHistory = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Finding all meal plans for user:", userId);

        const mealPlans = await Patient.find({ userId: String(userId) })
            .sort({ createdAt: -1 })
            .select('prediction progress skippedMeals mealNotes _id TDEE BMI createdAt age height weight gender activity_level preference restrictions')
            .lean();

        if (!mealPlans || mealPlans.length === 0) {
            return res.status(404).json({ error: 'No meal plans found' });
        }

        console.log(`Found ${mealPlans.length} meal plans`);
        res.status(200).json(mealPlans);
    } catch (error) {
        console.error("Error finding meal plans:", error);
        res.status(400).json({ error: error.message });
    }
};

// get user's meal plans
const getUserMealPlans = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Finding meal plans for user:", userId);

        const mealPlan = await Patient.findOne({ userId: String(userId) })
            .sort({ createdAt: -1 })
            .select('prediction progress skippedMeals mealNotes _id TDEE BMI createdAt age height weight gender activity_level preference restrictions')
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
        if (parseInt(age) < 18) {
            return res.status(400).json({ 
                error: 'Age must be at least 18 years to generate a meal plan.' 
            });
        }
        

        const BMI = calculateBMI(weight, height);
        const BMR = calculateBMR(weight, height, age);
        const TDEE = calculateTDEE(BMR, activity_level);
        
        // Add TDEE validation
        if (TDEE < 500) {
            return res.status(400).json({ 
                error: 'TDEE too low. Cannot generate meal plan for TDEE below 500 calories.' 
            });
        }
        
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

// Get meal plan history by access code
const getMealPlanHistoryByAccessCode = async (req, res) => {
    try {
        const { accessCode } = req.params;
        
        if (!accessCode) {
            return res.status(400).json({ error: 'Access code is required' });
        }
        
        // Find the patient by access code in the NutritionistPatient collection
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found with this access code' });
        }
        
        // Return the meal plan history array from the patient document
        if (!patient.mealPlanHistory || patient.mealPlanHistory.length === 0) {
            return res.status(404).json({ error: 'No meal plan history found for this patient' });
        }
        
        // Create a deep copy of the current patient's active data
        const currentMealPlan = {
            _id: patient._id.toString(),
            date: new Date(),
            createdAt: patient.createdAt || new Date(),
            prediction: patient.prediction || {},
            progress: patient.progress || {},
            skippedMeals: patient.skippedMeals || {},
            mealNotes: patient.mealNotes || {},
            nutritionistNotes: patient.nutritionistNotes || {},
            mealAddons: patient.mealAddons || {}
        };
        
        // Format all meal plan histories + add current as the first item
        const allMealPlans = [currentMealPlan, ...patient.mealPlanHistory].map(plan => {
            // Create a plain object that can be properly serialized
            const plainPlan = plan.toObject ? plan.toObject() : {...plan};
            
            // Ensure the date is a proper ISO string
            if (plainPlan.date) {
                plainPlan.date = new Date(plainPlan.date).toISOString();
            }
            
            // Add a properly formatted createdAt if it doesn't exist
            if (!plainPlan.createdAt) {
                plainPlan.createdAt = plainPlan.date || new Date().toISOString();
            } else {
                plainPlan.createdAt = new Date(plainPlan.createdAt).toISOString();
            }
            
            // Make sure all expected properties exist
            return {
                ...plainPlan,
                progress: plainPlan.progress || {},
                skippedMeals: plainPlan.skippedMeals || {},
                mealNotes: plainPlan.mealNotes || {},
                nutritionistNotes: plainPlan.nutritionistNotes || {},
                mealAddons: plainPlan.mealAddons || {}
            };
        });
        
        // Sort meal plan history by date in descending order (newest first)
        allMealPlans.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
            const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        res.status(200).json(allMealPlans);
    } catch (error) {
        console.error("Error fetching meal plan history by access code:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update historical meal plan by access code and meal plan ID
const updateHistoricalMealPlan = async (req, res) => {
    try {
        const { accessCode, mealPlanId } = req.params;
        const { day, meal, field, value, note, skipped, completed, addonIndex } = req.body;
        
        if (!accessCode || !mealPlanId) {
            return res.status(400).json({ error: 'Access code and meal plan ID are required' });
        }
        
        // Find the patient by access code
        const patient = await NutritionistPatient.findOne({ accessCode });
        
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found with this access code' });
        }
        
        // Find the specific meal plan in the history array
        const mealPlanIndex = patient.mealPlanHistory.findIndex(
            plan => plan._id.toString() === mealPlanId
        );
        
        if (mealPlanIndex === -1) {
            return res.status(404).json({ error: 'Meal plan not found in history' });
        }

        // Determine what to update based on the field
        switch(field) {
            case 'progress':
                // Initialize objects if they don't exist
                if (!patient.mealPlanHistory[mealPlanIndex].progress) {
                    patient.mealPlanHistory[mealPlanIndex].progress = {};
                }
                if (!patient.mealPlanHistory[mealPlanIndex].progress[day]) {
                    patient.mealPlanHistory[mealPlanIndex].progress[day] = {};
                }
                patient.mealPlanHistory[mealPlanIndex].progress[day][meal] = value;
                break;
                
            case 'skippedMeals':
                // Initialize objects if they don't exist
                if (!patient.mealPlanHistory[mealPlanIndex].skippedMeals) {
                    patient.mealPlanHistory[mealPlanIndex].skippedMeals = {};
                }
                if (!patient.mealPlanHistory[mealPlanIndex].skippedMeals[day]) {
                    patient.mealPlanHistory[mealPlanIndex].skippedMeals[day] = {};
                }
                patient.mealPlanHistory[mealPlanIndex].skippedMeals[day][meal] = skipped;
                
                // Update notes if the meal is skipped and a note is provided
                if (note !== undefined) {
                    if (!patient.mealPlanHistory[mealPlanIndex].mealNotes) {
                        patient.mealPlanHistory[mealPlanIndex].mealNotes = {};
                    }
                    if (!patient.mealPlanHistory[mealPlanIndex].mealNotes[day]) {
                        patient.mealPlanHistory[mealPlanIndex].mealNotes[day] = {};
                    }
                    patient.mealPlanHistory[mealPlanIndex].mealNotes[day][meal] = note;
                }
                break;
                
            case 'mealNotes':
                // Initialize objects if they don't exist
                if (!patient.mealPlanHistory[mealPlanIndex].mealNotes) {
                    patient.mealPlanHistory[mealPlanIndex].mealNotes = {};
                }
                if (!patient.mealPlanHistory[mealPlanIndex].mealNotes[day]) {
                    patient.mealPlanHistory[mealPlanIndex].mealNotes[day] = {};
                }
                patient.mealPlanHistory[mealPlanIndex].mealNotes[day][meal] = note;
                break;
                
            case 'addonStatus':
                // Check if the addon exists
                if (!patient.mealPlanHistory[mealPlanIndex].mealAddons) {
                    patient.mealPlanHistory[mealPlanIndex].mealAddons = {};
                }
                
                if (!patient.mealPlanHistory[mealPlanIndex].mealAddons[day]) {
                    patient.mealPlanHistory[mealPlanIndex].mealAddons[day] = {};
                }
                
                if (!patient.mealPlanHistory[mealPlanIndex].mealAddons[day][meal]) {
                    patient.mealPlanHistory[mealPlanIndex].mealAddons[day][meal] = [];
                }
                
                if (!patient.mealPlanHistory[mealPlanIndex].mealAddons[day][meal][addonIndex]) {
                    return res.status(404).json({ error: 'Addon not found' });
                }
                
                // Update the addon status
                if (completed !== undefined) {
                    patient.mealPlanHistory[mealPlanIndex].mealAddons[day][meal][addonIndex].completed = completed;
                }
                
                if (skipped !== undefined) {
                    patient.mealPlanHistory[mealPlanIndex].mealAddons[day][meal][addonIndex].skipped = skipped;
                }
                break;
                
            default:
                return res.status(400).json({ error: 'Invalid update field' });
        }
        
        // Save the updated patient document
        await patient.save();
        
        // Return the updated meal plan
        const updatedMealPlan = {
            _id: patient.mealPlanHistory[mealPlanIndex]._id,
            prediction: patient.mealPlanHistory[mealPlanIndex].prediction || {},
            progress: patient.mealPlanHistory[mealPlanIndex].progress || {},
            skippedMeals: patient.mealPlanHistory[mealPlanIndex].skippedMeals || {},
            mealNotes: patient.mealPlanHistory[mealPlanIndex].mealNotes || {},
            nutritionistNotes: patient.mealPlanHistory[mealPlanIndex].nutritionistNotes || {},
            mealAddons: patient.mealPlanHistory[mealPlanIndex].mealAddons || {},
            date: patient.mealPlanHistory[mealPlanIndex].date,
            createdAt: patient.mealPlanHistory[mealPlanIndex].createdAt || patient.mealPlanHistory[mealPlanIndex].date
        };
        
        res.status(200).json(updatedMealPlan);
    } catch (error) {
        console.error("Error updating historical meal plan:", error);
        res.status(500).json({ error: error.message });
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
    getUserMealPlansHistory,
    getUserMealPlans,
    generateGuestMealPlan,
    verifyAccessCode,
    getPatientDataByAccessCode,
    updateProgressByAccessCode,
    updateMealStatusByAccessCode,
    updateMealNotesByAccessCode,
    updateAddonStatusByAccessCode,
    getMealPlanHistoryByAccessCode,
    updateHistoricalMealPlan
};

