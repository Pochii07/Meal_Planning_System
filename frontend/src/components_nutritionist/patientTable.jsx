import React, { useEffect, useState, useRef, useCallback } from 'react';
import RecipeModal from './modals/recipeModal.jsx';
import MealPlanHistoryModal from './modals/mealPlanHistoryModal.jsx';
import { RECIPES_API } from '../config/api';
import CopyButton from './clipboard.jsx';
import useCopyToClipboard from '../hooks/use_clipboard';
import useForceUpdate from '../hooks/use_force_update';
import { patientService } from '../services/patientService';
import ChangeMealModal from './modals/ChangeMealModal.jsx';
import ConfirmChangeModal from './modals/ConfirmChangeModal.jsx';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

const PatientTable = ({ patients, onRemove, onRegenerateMealPlan, openRemoveDialog, setOpenRemoveDialog }) => {
  const { user } = useAuthStore();
  const { copiedCode, copyToClipboard } = useCopyToClipboard();
  const forceUpdate = useForceUpdate();
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const expandRef = useRef(null);
  const [mealCalories, setMealCalories] = useState({});
  const [mealPlanVersion, setMealPlanVersion] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["breakfast", "lunch", "dinner"];

  const [changeMealModalOpen, setChangeMealModalOpen] = useState(false);
  const [currentMealToChange, setCurrentMealToChange] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Initialize preferences and restrictions properly
  const [preferences, setPreferences] = useState({
    vegetarian: false,
    low_purine: false,
    low_fat: false,
    low_sodium: false,
  });

  const [restrictions, setRestrictions] = useState({
    lactose_free: false,
    peanut_allergy_safe: false,
    shellfish_allergy_safe: false,
    fish_allergy_safe: false,
    halal_kosher: false,
  });

  const handleMealSearch = async (searchQuery) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No user token found');
      return;
    }

    try {
      const response = await fetch(`${RECIPES_API}/search-filtered`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: searchQuery,
            preferences: preferences,  // Include preferences2 correctly
            restrictions: restrictions  // Include restrictions if defined
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  };

  const searchMealSuggestions = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No user token found');
      setSearchError('Please log in to search recipes');
      return;
    }
    
       // Check if the searchQuery is empty or null
    if (!searchQuery.trim()) {
      setSearchError('No input detected');  // Display the error message
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
  
    try {
      const response = await fetch(`${RECIPES_API}/search-filtered`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          preferences: preferences, // Pass preferences2
          restrictions: restrictions, // Pass restrictions
        }),
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
  
      const data = await response.json();
  
      if (data.success) {
        setMealSuggestions(data.data);
      } else {
        throw new Error(data.message || 'No recipes found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Failed to search recipes');
      setMealSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };
  

const handleSearchClick = () => {
    searchMealSuggestions();  // Trigger the search
};

// Function to fetch calories for a specific patient
const fetchPatientMealCalories = async (patientId) => {
    if (!patientId) return;

    const patient = patients.find(p => p._id === patientId);
    if (!patient) return;

    console.log(`Fetching meal calories for patient: ${patientId}`);
    console.log('Current token:', localStorage.getItem('token'));
    console.log('Is authenticated:', user?.isAuthenticated);

    const newMealCalories = {...mealCalories};
    newMealCalories[patientId] = {};

    for (const day of days) {
      newMealCalories[patientId][day] = {};
      for (const meal of meals) {
        const mealName = patient.prediction?.[day]?.[meal];
        if (mealName) {
          try {
            const response = await fetch(`${RECIPES_API}/title/${encodeURIComponent(mealName)}`);
            if (response.ok) {
              const recipeData = await response.json();
              newMealCalories[patientId][day][meal] = recipeData.calories || 0;
            }
          } catch (err) {
            console.error('Error fetching meal calories:', err);
          }
        }
      }
    }

    setMealCalories(newMealCalories);
};

// Effect that runs when expanded patient changes
useEffect(() => {
    if (expandedPatientId) {
      fetchPatientMealCalories(expandedPatientId);
    }
}, [expandedPatientId, mealPlanVersion]);

const handleRegenerateMealPlanClick = useCallback((patientId) => {
    console.log("Regenerating meal plan for patient:", patientId);
    
    onRegenerateMealPlan(patientId).then((updatedData) => {
      console.log("Meal plan regenerated successfully:", updatedData);

      setMealCalories({});
      setMealPlanVersion(prev => prev + 1);
      forceUpdate(); 

      setTimeout(() => {
        forceUpdate();
        console.log("Forced update after timeout");
      }, 500);
    });
}, [onRegenerateMealPlan, forceUpdate]);

const handleViewHistory = async (patientId) => {
    try {
        setSelectedPatientId(patientId);
        const history = await patientService.getMealPlanHistory(patientId);
        setSelectedPatientHistory(history);
        setHistoryModalOpen(true);
    } catch (error) {
        console.error('Error fetching meal plan history:', error);
    }
};

const calculateProgress = (progress, skippedMeals) => {
    if (!progress) return 0;

    let completed = 0;
    let total = 0;

    days.forEach(day => {
      meals.forEach(meal => {
        if (skippedMeals?.[day]?.[meal]) {
        } else {
          if (progress[day]?.[meal]) {
            completed++;
          }
          total++;
        }
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const handleChangeMeal = (day, meal, patientId, currentMeal) => {
    setCurrentMealToChange({
      day,
      meal,
      patientId,
      currentMeal
    });
    setChangeMealModalOpen(true);
};

const handleRemovePatient = (patientId) => {
    if (onRemove) {
      onRemove(patientId);
      setOpenRemoveDialog(true)
    }
};

const fetchRecipeDetails = async (mealName) => {
    if (!mealName) return;

    setLoadingRecipe(true);
    try {
      const response = await fetch(`${RECIPES_API}/title/${encodeURIComponent(mealName)}`);
      if (response.ok) {
        const recipeData = await response.json();
        setSelectedRecipe(recipeData);
        setRecipeModalOpen(true);
      } else {
        console.error('Recipe not found');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setLoadingRecipe(false);
    }
};

return (
  <div className="patient-table-container bg-white">
      <div className="patient-table-header">
          <table>
            <thead>
              <tr>
                <th>Name (LN, FN) </th>
                <th>Age</th>
                <th>BMI</th>
                <th>Progress</th>
                <th>Access Code</th>
                <th>Actions</th>
              </tr>
            </thead>
          </table>
      </div>   
      <div className="patient-table-body">
        {(!patients || patients.length === 0) ? (
          <div className='text-center text-gray-500 py-2'>
            No Patients found.
          </div>
        ) : (
          <table>
            {patients && patients.map((patient) => (
              <tbody key={patient._id}>
                <tr className="hover:bg-gray-50 transition-colors inherit">
                  <td className="td-name whitespace-normal break-words max-w-[200px]">
                    <div className="text-sm font-medium text-gray-900 uppercase">
                      {`${patient.lastName}, ${patient.firstName}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.age}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.BMI}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.progress ? (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${calculateProgress(patient.progress, patient.skippedMeals)}%` }}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">No progress yet</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className='flex items-center gap-2'>
                      <div className="text-sm font-mono bg-gray-100 p-1 rounded-md text-center">
                        {patient.accessCode || "No code"}
                      </div>
                      {patient.accessCode && (
                        <CopyButton 
                          code={patient.accessCode} 
                          copiedCode={copiedCode} 
                          onCopy={copyToClipboard} 
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-green-600 hover:text-green-900 mr-4 cursor-pointer" title="View patient's meal progress"
                      onClick={() =>
                        setExpandedPatientId(
                          expandedPatientId === patient._id ? null : patient._id
                        )
                      }
                    >
                      {expandedPatientId === patient._id
                        ? "Hide Progress"
                        : "View Progress"}
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                      onClick={() => {
                        handleRemovePatient(patient._id);
                        setOpenRemoveDialog(true);
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
                {expandedPatientId === patient._id && (
                  <tr>
                    <td ref={expandRef} colSpan="6" className="px-5 py-0 bg-gray-50">
                      <div className="mt-4 p-4 bg-white rounded-lg shadow">
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Patient Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Age: {patient.age} years old
                            </p>
                            <p className="text-sm text-gray-600">
                              Height: {patient.height} cm
                            </p>
                            <p className="text-sm text-gray-600">
                              Weight: {patient.weight} kg
                            </p>
                            <p className="text-sm text-gray-600">
                              BMI: {patient.BMI}
                            </p>
                            <p className="text-sm text-gray-600">
                              TDEE: {patient.TDEE - 600} calories
                            </p>
                            <p className="text-sm text-gray-600 font-semibold">
                              Access Code:
                              <div className="inline-flex gap-2">
                              <span className="bg-green-100 text-green-800 ml-2 p-1 rounded font-mono">
                                {patient.accessCode || "None"}
                              </span>
                              {patient.accessCode && (
                                <CopyButton 
                                  code={patient.accessCode} 
                                  copiedCode={copiedCode} 
                                  onCopy={copyToClipboard} 
                                />
                              )}
                              </div>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Activity Level: {patient.activity_level}
                            </p>
                            <p className="text-sm text-gray-600">
                              Dietary Preference: {patient.preference}  
                            </p>
                            <p className="text-sm text-gray-600">
                              Restrictions: {patient.restrictions}
                            </p>
                          </div>
                        </div>
                      </div>
                      {calculateProgress(patient.progress, patient.skippedMeals) >= 0}
                      

                      {/* Daily meals */}
                      <div className="grid grid-cols-7 gap-1 py-4">
                        <div className="col-span-7 mb-2 text-sm italic text-gray-600">
                          Click the recipe name for more information
                        </div>
                        {days.map((day) => (
                          <div key={day} className="bg-white p-4 rounded-lg shadow">
                            <h4 className="font-semibold text-gray-700 mb-2">
                              {day}
                            </h4>
                            <div className="space-y-2">
                              {meals.map((meal) => {
                                const mealName = patient.prediction?.[day]?.[meal];
                                const calories = mealCalories[patient._id]?.[day]?.[meal];

                                return (
                                  <div key={meal} className="flex items-start">
                                    <span className={`inline-block w-4 h-4 min-w-4 rounded-full mr-2 transition-colors`} />
                                    <div className="flex flex-col flex-1 w-full">
                                      <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                          <span className="font-semibold text-sm text-gray-700 capitalize">{meal}:</span>
                                          <span className={`text-sm`} onClick={() => fetchRecipeDetails(mealName)}>
                                            {mealName || 'No meal planned'}
                                            <span className="ml-2 text-xs text-gray-500">
                                              ({typeof calories === 'number' ? `${calories} kcal` : '...'})
                                            </span>
                                          </span>
                                        </div>
                                        {mealName && (
                                          <button
                                            onClick={() => handleChangeMeal(day, meal, patient._id, mealName)}
                                            className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                          >
                                            Change
                                          </button>
                                        )}
                                      </div>
                                      {patient.skippedMeals?.[day]?.[meal] && patient.mealNotes?.[day]?.[meal] && (
                                        <div className="mt-1 text-xs italic text-gray-600 bg-red-50 p-1.5 rounded border border-red-100">
                                          Note: {patient.mealNotes[day][meal]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))} 
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-end mt-0 gap-2">
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300" onClick={() => handleViewHistory(patient._id)}>
                          View History
                        </button>
                        {calculateProgress(patient.progress, patient.skippedMeals) >= 0 && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300" onClick={() => handleRegenerateMealPlanClick(patient._id)}>
                            Regenerate Meal Plan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}  
          </table>
        )}
      </div>    

      {/* Modals */}
      <RecipeModal recipe={selectedRecipe} isOpen={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} />
      <ChangeMealModal
        isOpen={changeMealModalOpen}
        onClose={() => {
          setChangeMealModalOpen(false);
          setSearchQuery('');
          setMealSuggestions([]);
        }}
        currentMeal={currentMealToChange?.currentMeal}
        onRecipeSelect={(recipe) => {
          updatePatientMeal(recipe.title);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        mealSuggestions={mealSuggestions}
        searchError={searchError}
        isSearching={isSearching}
        onSearch={searchMealSuggestions}
      />
  </div>
);

};

export default PatientTable;
