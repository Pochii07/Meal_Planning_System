import React, { useEffect, useState, useRef, useCallback } from 'react';
import RecipeModal from './modals/recipeModal.jsx';
import MealPlanHistoryModal from './modals/mealPlanHistoryModal.jsx';
import { RECIPES_API } from '../config/api';
import CopyButton from './clipboard.jsx';
import useCopyToClipboard from '../hooks/use_clipboard';
import useForceUpdate from '../hooks/use_force_update';
import { patientService } from '../services/patientService';
import { useAuthStore } from '../store/authStore';

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
  const [newSelectedMeal, setNewSelectedMeal] = useState(null);

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
          preferences: preferences,
          restrictions: restrictions
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
    
    if (!searchQuery.trim()) {
      setSearchError('No input detected');
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
          preferences: preferences,
          restrictions: restrictions,
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
    searchMealSuggestions();
  };

  const fetchPatientMealCalories = async (patientId) => {
    if (!patientId) return;

    const patient = patients.find(p => p._id === patientId);
    if (!patient) return;

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

  useEffect(() => {
    if (expandedPatientId) {
      fetchPatientMealCalories(expandedPatientId);
    }
  }, [expandedPatientId, mealPlanVersion]);

  const handleRegenerateMealPlanClick = useCallback((patientId) => {
    onRegenerateMealPlan(patientId).then((updatedData) => {
      setMealCalories({});
      setMealPlanVersion(prev => prev + 1);
      forceUpdate();

      setTimeout(() => {
        forceUpdate();
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
        if (!skippedMeals?.[day]?.[meal]) {
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
    setSearchQuery('');
    setMealSuggestions([]);
    setSelectedRecipe(null);
  };

  const handleRecipeSelect = (recipe) => {
    if (!recipe) return;
    setSelectedRecipe(recipe);
    setRecipeModalOpen(true);
  };

  const handleCloseRecipeModal = () => {
    setRecipeModalOpen(false);
    setSelectedRecipe(null);
  };

  const handleConfirmMealChange = async () => {
    if (!currentMealToChange || !newSelectedMeal) return;
    
    try {
      const { day, meal, patientId } = currentMealToChange;
      
      if (patientService.updatePatientMeal) {
        const response = await patientService.updatePatientMeal(
          patientId, 
          day, 
          meal, 
          newSelectedMeal
        );
        
        if (response.success) {
          setMealPlanVersion(prev => prev + 1);
          forceUpdate();
          setRecipeModalOpen(false);
          setSelectedRecipe(null);
          setNewSelectedMeal(null);
        }
      } else {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/patients/${patientId}/meals`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            day, 
            meal, 
            newMeal: newSelectedMeal 
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setMealPlanVersion(prev => prev + 1);
          forceUpdate();
          setRecipeModalOpen(false);
          setSelectedRecipe(null);
          setNewSelectedMeal(null);
        }
      }
    } catch (error) {
      console.error('Error updating meal:', error);
    }
  };

  const handleRemovePatient = (patientId) => {
    if (onRemove) {
      onRemove(patientId);
      setOpenRemoveDialog(true);
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
        console.error('Recipe not found', response.status);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  return (
    <div className="patient-table-container bg-white overflow-x-auto">
      <div className="patient-table-header">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">BMI</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
        </table>
      </div>   
      <div className="patient-table-body">
        {(!patients || patients.length === 0) ? (
          <div className='text-center text-gray-500 py-4'>
            No Patients found.
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            {patients.map((patient) => (
              <React.Fragment key={patient._id}>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {`${patient.lastName}, ${patient.firstName}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{patient.age}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{patient.BMI}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 min-w-[100px]">
                        {patient.progress ? (
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-green-600 h-2.5 rounded-full"
                              style={{ width: `${calculateProgress(patient.progress, patient.skippedMeals)}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500">No progress</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className='flex items-center gap-2'>
                        <div className="text-sm font-mono bg-gray-100 p-1 rounded-md">
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
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => setExpandedPatientId(expandedPatientId === patient._id ? null : patient._id)}
                        >
                          {expandedPatientId === patient._id ? "Hide" : "View"}
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            handleRemovePatient(patient._id);
                            setOpenRemoveDialog(true);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>

                {expandedPatientId === patient._id && (
                  <tbody>
                    <tr>
                      <td colSpan="6" className="px-4 py-3 bg-gray-50">
                        <div className="mt-2 p-4 bg-white rounded-lg shadow">
                          <h4 className="font-semibold text-gray-700 mb-3">Patient Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Age: {patient.age} years</p>
                              <p className="text-sm text-gray-600">Height: {patient.height} cm</p>
                              <p className="text-sm text-gray-600">Weight: {patient.weight} kg</p>
                              <p className="text-sm text-gray-600">BMI: {patient.BMI}</p>
                              <p className="text-sm text-gray-600">TDEE: {patient.TDEE - 600} cal</p>
                              <div className="text-sm text-gray-600 font-semibold mt-2">
                                Access Code:
                                <div className="inline-flex gap-2 items-center mt-1">
                                  <span className="bg-green-100 text-green-800 p-1 rounded font-mono">
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
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Activity: {patient.activity_level}</p>
                              <p className="text-sm text-gray-600">Preference: {patient.preference}</p>
                              <p className="text-sm text-gray-600">Restrictions: {patient.restrictions}</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm italic text-gray-600 mb-3">
                              Click recipe name for details
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                              {days.map((day) => (
                                <div key={day} className="bg-white p-3 rounded-lg shadow">
                                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">{day.substring(0, 3)}</h4>
                                  <div className="space-y-2">
                                    {meals.map((meal) => {
                                      const mealName = patient.prediction?.[day]?.[meal];
                                      const calories = mealCalories[patient._id]?.[day]?.[meal];

                                      return (
                                        <div key={meal} className="flex items-start">
                                          <div className="flex flex-col flex-1 w-full">
                                            <div className="flex justify-between items-start">
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-xs text-gray-700 capitalize">{meal}:</span>
                                                <span 
                                                  className={`text-xs cursor-pointer ${mealName ? 'text-black hover:text-green-900' : 'text-gray-500'}`} 
                                                  onClick={() => mealName && fetchRecipeDetails(mealName)}
                                                >
                                                  {mealName || 'No meal'}
                                                  <span className="ml-1 text-xs text-gray-500">
                                                    ({typeof calories === 'number' ? `${calories}kcal` : '...'})
                                                  </span>
                                                </span>
                                              </div>
                                              {mealName && (
                                                <button
                                                  onClick={() => handleChangeMeal(day, meal, patient._id, mealName)}
                                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                                  aria-label="Change meal"
                                                >
                                                  <svg className="w-3 h-3" fill="#189548" viewBox="0 0 383.748 383.748">
                                                    <path d="M62.772,95.042C90.904,54.899,137.496,30,187.343,30c83.743,0,151.874,68.13,151.874,151.874h30 C369.217,81.588,287.629,0,187.343,0c-35.038,0-69.061,9.989-98.391,28.888C70.368,40.862,54.245,56.032,41.221,73.593 L2.081,34.641v113.365h113.91L62.772,95.042z"/>
                                                    <path d="M381.667,235.742h-113.91l53.219,52.965c-28.132,40.142-74.724,65.042-124.571,65.042 c-83.744,0-151.874-68.13-151.874-151.874h-30c0,100.286,81.588,181.874,181.874,181.874c35.038,0,69.062-9.989,98.391-28.888 c18.584-11.975,34.707-27.145,47.731-44.706l39.139,38.952V235.742z"/>
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                            {patient.skippedMeals?.[day]?.[meal] && patient.mealNotes?.[day]?.[meal] && (
                                              <div className="mt-1 text-xs italic text-gray-600 bg-red-50 p-1 rounded border border-red-100">
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
                          </div>

                          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                            <button 
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                              onClick={() => handleViewHistory(patient._id)}
                            >
                              View History
                            </button>
                            {calculateProgress(patient.progress, patient.skippedMeals) >= 0 && (
                              <button 
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                onClick={() => handleRegenerateMealPlanClick(patient._id)}
                              >
                                Regenerate Plan
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                )}
              </React.Fragment>
            ))}  
          </table>
        )}
      </div>

      <RecipeModal 
        recipe={selectedRecipe} 
        isOpen={recipeModalOpen} 
        onClose={handleCloseRecipeModal}
        onConfirm={handleConfirmMealChange}
      />
            
      <MealPlanHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        history={selectedPatientHistory}
      />
      
      {changeMealModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setChangeMealModalOpen(false);
                setSearchQuery('');
                setMealSuggestions([]);
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
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-green-500 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchMealSuggestions();
                      }
                    }}
                  />
                  <button
                    onClick={handleSearchClick}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {searchError && (
                  <div className="text-red-500 mb-4">{searchError}</div>
                )}

                {mealSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {mealSuggestions.map((recipe) => (
                      <div
                        key={recipe._id}
                        className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRecipeSelect(recipe)}
                      >
                        <h4 className="font-medium">{recipe.title}</h4>
                        <p className="text-sm text-gray-600">{recipe.summary}</p>
                        <div className="mt-2">
                          <p className="text-sm text-[#008000] font-semibold">{recipe.calories} Calories</p>
                          {[
                            recipe.vegetarian && 'Vegetarian',
                            recipe.low_purine && 'Low Purine',
                            recipe.low_fat && 'Low Fat/Heart-Healthy',
                            recipe.low_sodium && 'Low Sodium',
                            recipe.lactose_free && 'Lactose Free',
                            !recipe.peanut_allergy_safe && 'Peanut Allergy Safe',
                            !recipe.shellfish_allergy_safe && 'Shellfish Allergy Safe',
                            !recipe.fish_allergy_safe && 'Fish Allergy Safe',
                            recipe.halal_kosher && 'Halal/Kosher'
                          ]
                            .filter(Boolean) 
                            .map((label, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-full mr-2 mt-1"
                              >
                                {label}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p>Meal selected. Viewing recipe details...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTable;