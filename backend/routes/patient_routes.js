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
    getUserMealPlansHistory,
    generateGuestMealPlan,
    verifyAccessCode,
    getPatientDataByAccessCode,
    updateProgressByAccessCode,
    updateMealNotes,
    updateMealStatusByAccessCode,
    updateMealNotesByAccessCode,
    updateAddonStatusByAccessCode,
    getMealPlanHistoryByAccessCode
} = require('../controllers/patient_controller')
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router()

// Get user meal plans
router.get('/user-meal-plans', verifyToken, getUserMealPlans)

// Get user meal plans history
router.get('/user-meal-plans/history', verifyToken, getUserMealPlansHistory);

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

// Update addon status for guest meal tracker
router.patch('/update-addon-status/:accessCode', updateAddonStatusByAccessCode);

// Add this new route for meal notes
router.patch('/:id/meal-notes', verifyToken, updateMealNotes)

// Add this with your other routes
router.get('/access-code-history/:accessCode', getMealPlanHistoryByAccessCode);

module.exports = router

