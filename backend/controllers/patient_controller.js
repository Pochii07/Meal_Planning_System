const Patient = require('../models/patient_model')
const mongoose = require('mongoose')
const axios = require('axios')

// get all patients
const getAllPatients = async (req, res) => {
    const allPatients = await Patient.find({}).sort({createdAt: - 1})

    const formattedPatients = allPatients.map(patient => {
        const { progress, ...details } = patient._doc // Separate details and progress
        return { ...details, progress } // Reorder: details first, then progress
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

        const { progress, ...details } = patient._doc // Separate details and progress
        res.status(200).json({ ...details, progress }) // Reorder: details first, then progress
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
    const userId = req.userId; // Get userId from auth middleware

    try {
        // Get prediction from Flask API
        const response = await axios.post('http://127.0.0.1:5000/predict_meal_plan', {
            age,
            height,
            weight,
            gender,
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level
        });

        const prediction = response.data.predicted_meal_plan;
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
        res.status(400).json({ error: error.message });
    }
};

// get user's meal plans
const getUserMealPlans = async (req, res) => {
    const userId = req.userId;
    try {
        const mealPlans = await Patient.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(mealPlans);
    } catch (error) {
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
    const { id } = req.params
    const { day, meal } = req.body

    if (!['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day)) {
        return res.status(400).json({ error: 'Invalid day provided' })
    }
    if (!['breakfast', 'lunch', 'dinner'].includes(meal)) {
        return res.status(400).json({ error: 'Invalid meal provided' })
    }

    try {
        const patient = await Patient.findById(id)
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' })
        }

        patient.progress[day][meal] = true // Mark the meal as eaten
        await patient.save()

        res.status(200).json({ message: `Updated ${meal} progress for ${day}`, progress: patient.progress })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

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



module.exports = {
    getAllPatients,
    getPatient,
    newPatient,
    deletePatient,
    updatePatient,
    updateMealProgress,
    getWeeklyProgress,
    getUserMealPlans

}
