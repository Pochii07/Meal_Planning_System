const NutritionistPatient = require('../models/nutritionist_patient_model')
const mongoose = require('mongoose')
const axios = require('axios');
const express = require('express');
const router = express.Router();  // Initialize the router

const updatePatientMeal = async (req, res) => {
    const { id } = req.params;  // Get patient ID from the request parameters
    const { day, meal, newMeal } = req.body; // Get the new meal details from the request body
  
    if (!id || !day || !meal || !newMeal) {
      return res.status(400).json({ success: false, message: 'Missing fields for updating meal' });
    }
  
    try {
      const patient = await NutritionistPatient.findById(id);  // Find the patient by ID
  
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
  
      // Ensure the day exists in the prediction object, if not, create it
      if (!patient.prediction[day]) {
        patient.prediction[day] = {};
      }
  
      // Update the patient's meal for the given day
      patient.prediction[day][meal] = newMeal;
  
      await patient.save();  // Save the updated patient document
  
      return res.status(200).json({
        success: true,
        message: 'Meal updated successfully',
        updatedPatient: patient,
      });
    } catch (error) {
      console.error('Error updating patient meal:', error);
      return res.status(500).json({ success: false, message: 'Server error updating meal' });
    }
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
        const response = await axios.post('http://127.0.0.1:5000/predict_meal_plan', {
            age,
            height,
            weight,
            gender,
            dietary_restrictions: preference,
            allergies: restrictions,
            activity_level
        });

        const BMI = (weight / ((height / 100) ** 2)).toFixed(2);
        const rawPrediction = response.data.predicted_meal_plan;
        let prediction = {};

        try {
            // Check if rawPrediction is already an object
            if (typeof rawPrediction === 'string') {
                prediction = JSON.parse(rawPrediction.replace(/'/g, '"'));
            } else if (typeof rawPrediction === 'object') {
                // If it's already an object, use it directly
                prediction = rawPrediction;
            } else {
                console.error('Unexpected prediction format:', typeof rawPrediction);
            }
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

module.exports = {
    getNutritionistPatients,
    getNutritionistPatient,
    createNutritionistPatient,
    updateNutritionistPatient,
    deleteNutritionistPatient,
    updatePatientProgress,
    updatePatientMeal  // Keep the export here
};
