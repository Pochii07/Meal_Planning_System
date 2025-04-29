const express = require('express')
const {
    getNutritionistPatients,
    getNutritionistPatient,
    createNutritionistPatient,
    updateNutritionistPatient,
    deleteNutritionistPatient,
    regenerateMealPlan,
    getMealPlanHistory,  
    updateNutritionistNotes,
    addMealAddon,
    removeMealAddon,
    updateAddonStatus
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
router.post('/:id/regenerate-meal-plan', verifyToken, regenerateMealPlan)

// Get meal plan history for a patient
router.get('/:id/meal-plan-history', verifyToken, getMealPlanHistory)

// Update nutritionist notes for a patient
router.patch('/:id/nutritionist-notes', verifyToken, updateNutritionistNotes)

// Add meal addon for a patient
router.post('/:id/addon', verifyToken, addMealAddon);

// Remove meal addon for a patient
router.delete('/:id/addon', verifyToken, removeMealAddon);

// Update addon status (completed/skipped)
router.patch('/:id/addon-status', verifyToken, updateAddonStatus);

module.exports = router