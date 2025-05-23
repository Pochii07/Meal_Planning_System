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
  },

  updateNutritionistNotes: async (patientId, day, meal, note) => {
    const response = await fetch(`${NUTRITIONIST_API}/${patientId}/nutritionist-notes`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ day, meal, note })
    });
    const data = await response.json();
    
    // Make sure we're returning the data from the response
    return data;
  },

  addMealAddon: async (patientId, day, meal, addonText) => {
    try {
      const response = await fetch(`${NUTRITIONIST_API}/${patientId}/addon`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          day,
          meal,
          addonText
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding meal addon:', error);
      throw error;
    }
  },

  removeMealAddon: async (patientId, day, meal, addonIndex) => {
    try {
      const response = await fetch(`${NUTRITIONIST_API}/${patientId}/addon`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          day,
          meal,
          addonIndex
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error removing meal addon:', error);
      throw error;
    }
  },

  archivePatient: async (patientId) => {
    const response = await fetch(`${NUTRITIONIST_API}/${patientId}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to archive patient');
    }

    return response.json();
  },

  restorePatient: async (patientId) => {
    const response = await fetch(`${NUTRITIONIST_API}/${patientId}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to restore patient');
    }

    return response.json();
  },

  fetchArchivedPatients: async () => {
    const response = await fetch(`${NUTRITIONIST_API}/archived`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};