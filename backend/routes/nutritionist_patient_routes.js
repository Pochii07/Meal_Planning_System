// backend/routes/nutritionist_patient_routes.js
const express = require('express')
const {
    getNutritionistPatients,
    getNutritionistPatient,
    createNutritionistPatient,
    updateNutritionistPatient,
    deleteNutritionistPatient,
    regenerateMealPlan  // Add this import
} = require('../controllers/nutritionist_patient_controller')
const { verifyToken } = require('../middleware/verifyToken')

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// Get all nutritionist's patients
router.get('/', getNutritionistPatients)

// Get single patient
router.get('/:id', getNutritionistPatient)

// Create new patient
router.post('/', createNutritionistPatient)

// Update patient
router.patch('/:id', updateNutritionistPatient)

// Delete patient
router.delete('/:id', deleteNutritionistPatient)

// Regenerate meal plan for a patient
router.post('/:id/regenerate-meal-plan', verifyToken, regenerateMealPlan)  // Fix this line

module.exports = router