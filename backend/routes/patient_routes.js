const express = require('express')
const {
    getAllPatients,
    newPatient,
    getPatient,
    deletePatient,
    updatePatient

} = require('../controllers/patient_controller')

const router = express.Router()

// Get all cases
router.get('/', getAllPatients)

// Get a single case
router.get('/:id',getPatient)

// Post a new case
router.post('/',newPatient)

// Delete case
router.delete('/:id',deletePatient)

// Update case
router.patch('/:id',updatePatient)

module.exports = router

