import { NUTRITIONIST_API } from '../config/api';
import { useState } from 'react';
import { patientService } from '../services/patientService';
import { getAuthHeaders } from '../utils/authHeaders';

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
      console.log("Regenerate meal plan response:", data); // Add logging
      
      if (response.ok) {
        // Validate that the data has the expected structure
        if (!data.prediction) {
          console.error("Missing prediction data in response:", data);
          setError('Invalid response data: missing prediction');
          return Promise.reject('Invalid response data: missing prediction');
        }

        // Check if patients array exists before mapping
        if (patients && Array.isArray(patients)) {
          const updatedPatients = patients.map(patient => 
            patient._id === patientId ? { 
              ...patient, 
              prediction: data.prediction, 
              progress: data.progress || {}, 
              skippedMeals: data.skippedMeals || {}, 
              mealNotes: data.mealNotes || {} 
            } : patient
          );
          
          console.log("Updated patients:", updatedPatients); // Add logging
          dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
        }
        setError(null);
        return data; // Return the updated patient data
      } else {
        setError(data.error || 'Failed to regenerate meal plan');
        return Promise.reject(data.error || 'Failed to regenerate meal plan');
      }
    } catch (error) {
      console.error('Error regenerating meal plan:', error);
      setError('An error occurred while regenerating the meal plan');
      return Promise.reject(error);
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