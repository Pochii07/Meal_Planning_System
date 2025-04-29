import React, { useEffect, useState, useCallback } from 'react';
import { useNutritionistPatientContext } from '../hooks/use_nutritionist_patient_context';
import { usePatientManagement } from '../hooks/use_patient_management';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';

import AddPatientForm from '../components_nutritionist/addPatient';
import PatientTable from '../components_nutritionist/patientTable';
import PatientSearchBar from '../components_nutritionist/searchbar';

import { BMI_CATEGORIES } from '../components_nutritionist/searchbar';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const DIETARY_PREFERENCES = [
  "Vegetarian",
  "Low-Purine",
  "Low-Fat/Heart-Healthy",
  "Low-Sodium"
];

const DIETARY_RESTRICTIONS = [
  "Contains Dairy",
  "Contains Peanuts",
  "Contains Shellfish",
  "Contains Fish",
  "Halal or Kosher"
];

const labelColors = {
  'Vegetarian': 'green',
  'Low-Fat/Heart-Healthy': 'blue',
  'Low-Sodium': 'orange',
  'Lactose-Free': 'purple',
  'Peanut-Allergy-Safe': 'red',
  'Shellfish-Allergy-Safe': 'yellow',
  'Fish-Allergy-Safe': 'pink',
  'Halal-or-Kosher': 'brown'
};

const NutritionistDashboard = () => {
  const { patients = [], dispatch } = useNutritionistPatientContext();
  const { user, isAuthenticated, isCheckingAuth } = useAuthStore();
  const navigate = useNavigate();
  
  // State management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [removingPatientId, setRemovingPatientId] = useState(null);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [currSearchText, setCurrSearchText] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [changeMealModalOpen, setChangeMealModalOpen] = useState(false);
  const [currentMealToChange, setCurrentMealToChange] = useState(null);
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);

  const {
    loading,
    error,
    handleCreatePatient,
    setLoading,
    setError
  } = usePatientManagement(dispatch);
  
  const handleRemovePatient = async (patientId) => {
    setRemovingPatientId(patientId);
    setOpenRemoveDialog(true);
  };
  
  const confirmRemovePatient = async () => {
    if (!removingPatientId) return;
    
    try {
      await patientService.removePatient(removingPatientId);
      dispatch({ 
        type: 'SET_PATIENTS', 
        payload: patients.filter(patient => patient._id !== removingPatientId) 
      });
    } catch (error) {
      console.error('Error removing patient:', error);
      setError('Failed to remove patient');
    } finally {
      setRemovingPatientId(null);
      setOpenRemoveDialog(false);
    }
  };

  const handleRegenerateMealPlan = useCallback(async (patientId) => {
    try {
      setLoading(true);
      console.log("Starting meal plan regeneration for patient:", patientId);
      
      // Call the service to regenerate the meal plan
      const response = await patientService.regenerateMealPlan(patientId);
      console.log("Regeneration API response:", response);
      
      if (!response) {
        console.error("Failed to regenerate meal plan - empty response");
        setError('Failed to regenerate meal plan');
        return null;
      }
      
      // Update patients in context with the new data
      const updatedPatients = patients.map(p => 
        p._id === patientId ? {
          ...p,
          prediction: response.prediction,
          progress: response.progress || {},
          skippedMeals: response.skippedMeals || {},
          mealNotes: response.mealNotes || {}
        } : p
      );
      
      console.log("Dispatching updated patients:", updatedPatients);
      dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
      
      // Also do a full refresh from the backend to ensure data consistency
      setTimeout(async () => {
        const refreshedPatients = await patientService.getAllPatients();
        if (refreshedPatients) {
          console.log("Dispatching refreshed patients:", refreshedPatients);
          dispatch({ type: 'SET_PATIENTS', payload: refreshedPatients });
        }
      }, 300);
      
      return response;
    } catch (error) {
      console.error('Failed to regenerate meal plan:', error);
      setError('Failed to regenerate meal plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, [patients, dispatch, patientService]);

  useEffect(() => {
    const fetchInitialPatients = async () => {
      try {
        setLoading(true);
        const fetchedPatients = await patientService.fetchPatients();
        dispatch({ type: 'SET_PATIENTS', payload: fetchedPatients });
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    if (!isCheckingAuth) {
      if (!isAuthenticated || !user || user.role !== 'nutritionist') {
        navigate('/'); // redirect non-nutritionist users
      } else {
        fetchInitialPatients(); // fetch patients if user is authenticated nutritionist
      }
    }
  }, [user, isAuthenticated, isCheckingAuth, navigate]);

  useEffect(() => {
    // Initialize filteredPatients with all patients when component mounts
    setFilteredPatients(patients || []);
  }, [patients]);

  const handleSearch = (searchText, filterType) => {
    setCurrSearchText(searchText);
    if (!patients) {
      setFilteredPatients([]);
      return;
    }
  
    const filtered = patients.filter(patient => {
      if (!searchText) return true;

      switch (filterType) {
        case 'name':
          return `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchText.toLowerCase());
        case 'age':
          return patient.age.toString() === searchText;
        case 'bmi':
          const category = BMI_CATEGORIES.find(c => c.label === searchText);
          if (!category) return false;
          return patient.BMI >= category.range[0] && patient.BMI <= category.range[1];
        default:
          return true;
      }
    });
    setFilteredPatients(filtered);
  };

  const handlePreferenceChange = (value) => {
    setSelectedPreferences(prev => {
      const set = new Set(prev);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      return Array.from(set);
    });
  };
  
  const handleRestrictionChange = (value) => {
    setSelectedRestrictions(prev => {
      const set = new Set(prev);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      return Array.from(set);
    });
  };
  
  const filterMealSuggestions = () => {
    if (!mealSuggestions || mealSuggestions.length === 0) {
        return [];
    }
  
    return mealSuggestions.filter(recipe => {
        // Check preferences (ALL must match)
        for (const preference of selectedPreferences) {
            if (!recipe[preference.toLowerCase().replace(/\s|-/g, '_')]) return false;
        }

        // Check restrictions (ALL must match)
        for (const restriction of selectedRestrictions) {
            const key = restriction.toLowerCase().replace(/\s|-/g, '_');
            if (!recipe[key.replace('contains_', '').replace('or_', '_')]) return false;
        }

        return true;
    });
  };

  const handleChangeMeal = (day, meal) => {
    const patient = patients.find(p => p._id === expandedPatientId);
    if (!patient) return;
  
    setCurrentMealToChange({
      day,
      meal,
      currentMeal: patient.prediction?.[day]?.[meal] || '', 
      patientId: expandedPatientId, 
    });
  
    setChangeMealModalOpen(true); 
  };
  
  const updatePatientMeal = async (newMeal) => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      console.log('No token found. Redirecting to login...');
      navigate('/login');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:4000/api/nutritionist/patients/${currentMealToChange.patientId}/meal`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day: currentMealToChange.day,
          meal: currentMealToChange.meal,
          newMeal,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update meal');
      }
  
      const updatedPatient = await response.json();
      dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient.updatedPatient });
      setChangeMealModalOpen(false);
      setSearchQuery('');
      setMealSuggestions([]);
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error updating meal:', error);
      setSearchError('Failed to update meal. Please try again.');
    }
  };
  
  const searchMealSuggestions = async () => {
    setIsSearching(true);
    setSearchError(null);
  
    try {
      // Get token from localStorage (consistent with your auth store)
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setSearchError('Please login to see recipes');
        navigate('/login');  // Redirect to login if no token
        return;
      }
  
      const response = await fetch('/api/recipes/search-filtered', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          preferences: {
            vegetarian: selectedPreferences.includes('Vegetarian'),
            low_purine: selectedPreferences.includes('Low-Purine'),
            low_fat: selectedPreferences.includes('Low-Fat/Heart-Healthy'),
            low_sodium: selectedPreferences.includes('Low-Sodium')
          },
          restrictions: {
            lactose_free: selectedRestrictions.includes('Contains Dairy'),
            peanut_allergy_safe: selectedRestrictions.includes('Contains Peanuts'),
            shellfish_allergy_safe: selectedRestrictions.includes('Contains Shellfish'),
            fish_allergy_safe: selectedRestrictions.includes('Contains Fish'),
            halal_kosher: selectedRestrictions.includes('Halal or Kosher')
          }
        })
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.message || 'Failed to search recipes');
      }
  
      const recipes = await response.json();
      setMealSuggestions(recipes);
  
      if (recipes.length === 0) {
        setSearchError('No recipes found matching your search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Failed to search recipes');
      setMealSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleConfirmMealChange = () => {
    if (currentMealToChange && selectedRecipe) {
      const { day, meal, patientId } = currentMealToChange;
  
      updatePatientMeal(selectedRecipe.title).then(() => {
        const updatedPatient = patients.find(patient => patient._id === patientId);
        if (updatedPatient) {
          updatedPatient.prediction[day][meal] = selectedRecipe.title;
          dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient });
          setChangeMealModalOpen(false);
          setSearchQuery('');
          setMealSuggestions([]);
          setSelectedRecipe(null);
        }
      });
    }
  };
  
  // Debounce search logic
  const debounceSearch = useCallback((func, delay) => {
    let timerId;
    return (...args) => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const debouncedSearchMealSuggestions = useCallback(debounceSearch(searchMealSuggestions, 500), [searchQuery, changeMealModalOpen]);

  useEffect(() => {
    if (searchQuery.trim() && changeMealModalOpen) {
      debouncedSearchMealSuggestions();
    }
  }, [searchQuery, changeMealModalOpen, debouncedSearchMealSuggestions]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Add Patient Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Patient Management</h1>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
        >
          {isFormOpen ? 'Close Form' : 'Add New Patient'}
        </button>
      </div>
      <PatientSearchBar 
        onSearchChange={handleSearch}
      />
      {/* Change Meal Modal */}
      {changeMealModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setChangeMealModalOpen(false);
                setSearchQuery('');
                setMealSuggestions([]);
                setSelectedRecipe(null); 
              }}
            >
              ×
            </button>
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Change {currentMealToChange?.meal} for {currentMealToChange?.day}
            </h2>
            {!selectedRecipe ? (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search meals..."
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-green-500 w-[625px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchMealSuggestions();
                      }
                    }}
                  />
                  
                  {/* Dietary Preferences */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Dietary Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_PREFERENCES.map(preference => (
                        <label key={preference} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedPreferences.includes(preference)}
                            onChange={() => handlePreferenceChange(preference)}
                            className="h-4 w-4 text-green-600 rounded"
                          />
                          <span>{preference}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Restrictions */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Dietary Restrictions</h4>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_RESTRICTIONS.map(restriction => (
                        <label key={restriction} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedRestrictions.includes(restriction)}
                            onChange={() => handleRestrictionChange(restriction)}
                            className="h-4 w-4 text-green-600 rounded"
                          />
                          <span>{restriction}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {searchError && (
                  <div className="p-4 mb-4 text-red-600 bg-red-100 rounded-lg">
                    {searchError.includes('login') ? (
                      <button 
                        onClick={() => navigate('/login')}
                        className="text-blue-600 underline"
                      >
                        {searchError} (Click to login)
                      </button>
                    ) : (
                      searchError
                    )}
                  </div>
                )}

                {mealSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {mealSuggestions.map((recipe) => (
                      <div
                        key={recipe._id}
                        className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <h4 className="font-medium">{recipe.title}</h4>
                        <p className="text-sm text-gray-600">{recipe.summary}</p>

                        <div className="mt-2">
                          <p className="text-sm text-[#008000] font-semibold">{recipe.calories} Calories</p>

                          {[recipe.vegetarian, recipe.low_purine, recipe.low_fat, recipe.low_sodium, recipe.lactose_free, recipe.peanut_allergy_safe, recipe.shellfish_allergy_safe, recipe.fish_allergy_safe, recipe.halal_kosher]
                            .map((label, idx) => {
                              const key = Object.keys(labelColors)[idx];
                              return label && (
                                <span
                                  key={idx}
                                  className="inline-block bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-full mr-2 mt-1"
                                >
                                  {key}
                                </span>
                              );
                            })
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{selectedRecipe.title}</h3>
                  <p className="text-gray-600 mb-4">{selectedRecipe.summary}</p>

                  <h4 className="font-semibold mb-2">Ingredients:</h4>
                  <ul className="list-disc list-inside mb-4 text-sm">
                    {selectedRecipe.ingredients.split(',').map((ingredient, idx) => (
                      <li key={idx}>{ingredient.trim()}</li>
                    ))}
                  </ul>

                  {selectedRecipe.instructions && (
                    <>
                      <h4 className="font-semibold mb-2">Instructions:</h4>
                      <ol className="list-decimal list-inside text-sm">
                        {selectedRecipe.instructions.split('.').filter(i => i.trim()).map((step, idx) => (
                          <li key={idx}>{step.trim()}.</li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                    onClick={() => {
                      setSelectedRecipe(null);
                    }}
                  >
                    Back
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => handleConfirmMealChange()}
                  >
                    Confirm Change
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Patient Form */}
      {isFormOpen && (
        <AddPatientForm 
          onSubmit={handleCreatePatient}
          error={error}
          dispatch={dispatch}
          setIsFormOpen={setIsFormOpen}
        />
      )}
      {/* Patients Table */}
      <PatientTable 
          patients={currSearchText ? filteredPatients : patients}
          onRemove={handleRemovePatient}
          onRegenerateMealPlan={handleRegenerateMealPlan}
          onSearchMealSuggestions={searchMealSuggestions} 
          openRemoveDialog={openRemoveDialog}
          setOpenRemoveDialog={setOpenRemoveDialog}
          userToken={localStorage.getItem('authToken')} 
        />     
      <Dialog
        open={openRemoveDialog}
        onClose={() => {
          setOpenRemoveDialog(false);
          setRemovingPatientId(null);
        }}
        aria-labelledby="remove-patient-dialog-title"
      >
        <DialogTitle id="remove-patient-dialog-title">
          Confirm Patient Removal
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this patient? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenRemoveDialog(false);
              setRemovingPatientId(null);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRemovePatient}
            color="error"
            autoFocus
          >
            Remove Patient
          </Button>
        </DialogActions>
      </Dialog>
      
    </div>
  )
}

export default NutritionistDashboard;
