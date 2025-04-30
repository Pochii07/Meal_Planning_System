import { NUTRITIONIST_API } from '../config/api';
import { getAuthHeaders } from '../utils/authHeaders';
import { API_URL } from '../config/api';

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

  updatePatientMeal: async (patientId, day, meal, newMeal) => {
    try {
      const response = await fetch(`${API_URL}/patients/${patientId}/update-meal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ day, meal, newMeal })
      });
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid response: ${text}`);
      }
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update meal');
      }
  
      return data;
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
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