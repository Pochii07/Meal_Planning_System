const express = require('express')
const {
    getAllPatients,
    newPatient,
    getPatient,
    deletePatient,
    updatePatient,
    updateMealProgress,
    getWeeklyProgress,
    getUserMealPlans,
    generateGuestMealPlan,
    verifyAccessCode,
    getPatientDataByAccessCode,
    updateProgressByAccessCode,
    updateMealNotes,
    updateMealStatusByAccessCode,
    updateMealNotesByAccessCode

} = require('../controllers/patient_controller')
const { verifyToken } = require('../middleware/verifyToken');
const { updateMeal } = require('../controllers/patient_controller');

const router = express.Router()

// Get user meal plans
router.get('/user-meal-plans', verifyToken, getUserMealPlans)

// Get all cases
router.get('/', getAllPatients)

// Get a single case
router.get('/:id',getPatient)

// Post a new case
router.post('/', verifyToken, newPatient)

// Delete case
router.delete('/:id',deletePatient)

// Update case
router.patch('/:id',updatePatient)

// Update mealplan progress
router.patch('/:id/progress', updateMealProgress)

// Get progress
router.get('/:id/progress', getWeeklyProgress)

// Add this new route for guests
router.post('/guest-predict', generateGuestMealPlan)

// Add new routes for access code verification and data retrieval
router.post('/verify-access-code', verifyAccessCode);
router.get('/access-code-data/:accessCode', getPatientDataByAccessCode);
router.patch('/update-progress/:accessCode', updateProgressByAccessCode);
router.patch('/update-meal-status/:accessCode', updateMealStatusByAccessCode);
router.patch('/update-meal-notes/:accessCode', updateMealNotesByAccessCode);

// Add this new route for meal notes
router.patch('/:id/meal-notes', verifyToken, updateMealNotes)

// Updating a patient's meal
router.patch('/:patientId/update-meal', verifyToken, updateMeal);

module.exports = router

