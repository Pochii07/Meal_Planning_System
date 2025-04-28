const express = require('express');
const {
    getNutritionistPatients,
    getNutritionistPatient,
    createNutritionistPatient,
    updateNutritionistPatient,
    deleteNutritionistPatient,
    updatePatientProgress,
    updatePatientMeal
} = require('../controllers/nutritionist_patient_controller');  
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.patch('/:id/meal', updatePatientMeal);
router.patch('/:id/progress', updatePatientProgress); 
router.get('/', getNutritionistPatients);
router.get('/:id', getNutritionistPatient);
router.post('/', createNutritionistPatient); 
router.patch('/:id', updateNutritionistPatient);
router.delete('/:id', deleteNutritionistPatient);

module.exports = router;
