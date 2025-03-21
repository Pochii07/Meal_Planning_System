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
    generateGuestMealPlan // Add this new controller
} = require('../controllers/patient_controller')
const { verifyToken } = require('../middleware/verifyToken');

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

module.exports = router

