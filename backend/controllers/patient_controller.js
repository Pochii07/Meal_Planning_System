const Patient = require('../models/patient_model')
const mongoose = require('mongoose')

// get all patients
const getAllPatients = async (req, res) => {
    const allPatients = await Patient.find({}).sort({createdAt: - 1})

    res.status(200).json(allPatients)
}

// get patient
const getPatient = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'no patient found'})
    }

    const findPatient = await Patient.findById(id)

    if (!findPatient) {
        return res.status(404).json({error: 'No patient found'})
    }

    res.status(200).json(findPatient)
}

// for calculation of BMI
const calculateBMI = (weight,height) =>{
    return (weight / ((height / 100) ** 2)).toFixed(2);
}

// new patient
const newPatient = async (req, res) => {
    const {age, height, weight, activity_level, preference, restrictions} = req.body
    
    // add doc to db
    try{
        const BMI = calculateBMI(weight, height)
        const new_patient = await Patient.create({age, height, weight, BMI, activity_level, preference, restrictions})
        res.status(200).json(new_patient)
    } catch(error){
        res.status(400).json({error: error.message})
    }
}

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



module.exports = {
    getAllPatients,
    getPatient,
    newPatient,
    deletePatient,
    updatePatient

}