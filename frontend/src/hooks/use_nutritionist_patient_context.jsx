import { useContext } from 'react'
import { NutritionistPatientContext } from '../context/nutritionist_patient_context'

export const useNutritionistPatientContext = () => {
  const context = useContext(NutritionistPatientContext)
  if (!context) {
    throw Error('useNutritionistPatientContext must be used inside a NutritionistPatientContextProvider')
  }
  return context
}