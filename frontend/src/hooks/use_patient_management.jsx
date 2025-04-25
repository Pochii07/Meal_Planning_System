import { useState } from 'react';
import { patientService } from '../services/patientService';

export const usePatientManagement = (dispatch, patients) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreatePatient = async (patientData) => {
    setLoading(true);
    try {
      const response = await patientService.createPatient(patientData);
      if (response.ok) {
        dispatch({ type: 'CREATE_PATIENT', payload: response });
        return true;
      } else {
        setError(response.error || "Failed to create patient");
        return false;
      }
    } catch (error) {
      setError("An unexpected error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePatient = async (patientId) => {
    try {
      await patientService.removePatient(patientId);
      if (patients) {
        dispatch({ 
            type: 'SET_PATIENTS', 
            payload: patients.filter(patient => patient._id !== patientId) 
          });
      }
      return true;
    } catch (error) {
      setError("Failed to remove patient");
      return false;
    }
  };

  const handleRegenerateMealPlan = async (patientId) => {
    try {
      setLoading(true);
      const response = await fetch(`${NUTRITIONIST_API}/${patientId}/regenerate-meal-plan`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update patient in state with new meal plan
        const updatedPatients = patients.map(patient => 
          patient._id === patientId ? { ...patient, prediction: data.prediction, progress: data.progress, skippedMeals: data.skippedMeals, mealNotes: data.mealNotes } : patient
        );
        dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
        setError(null);
      } else {
        setError(data.error || 'Failed to regenerate meal plan');
      }
    } catch (error) {
      console.error('Error regenerating meal plan:', error);
      setError('An error occurred while regenerating the meal plan');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleCreatePatient,
    handleRemovePatient,
    handleRegenerateMealPlan,
    setLoading,
    setError,
  };
};