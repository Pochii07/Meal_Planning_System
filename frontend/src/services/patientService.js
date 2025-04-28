import { NUTRITIONIST_API } from '../config/api';
import { getAuthHeaders } from '../utils/authHeaders';

export const patientService = {
  fetchPatients: async () => {
    const response = await fetch(NUTRITIONIST_API, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createPatient: async (patientData) => {
    const response = await fetch(NUTRITIONIST_API, {
      method: 'POST',
      body: JSON.stringify(patientData),
      headers: getAuthHeaders()
    });
    return response.json();
  },

  removePatient: async (patientId) => {
    const response = await fetch(`${NUTRITIONIST_API}/${patientId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove patient');
    }
  
    return response.json();
  },

  regenerateMealPlan: async (patientId) => {
    const response = await fetch(`${NUTRITIONIST_API}/${patientId}/regenerate-meal-plan`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getMealPlanHistory: async (patientId) => {
    const response = await fetch(`${NUTRITIONIST_API}/${patientId}/meal-plan-history`, {
        headers: getAuthHeaders()
    });
    return response.json();
  }
};