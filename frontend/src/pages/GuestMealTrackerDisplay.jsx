import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PATIENT_API, RECIPES_API } from '../config/api';

import RecipeCard from '../components/RecipeCard.jsx';

const GuestMealTrackerDisplay = () => {
  const { accessCode } = useParams();
  const [mealPlan, setMealPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [skippedMeals, setSkippedMeals] = useState({});
  const [mealNotes, setMealNotes] = useState({});
  const [nutritionistNotes, setNutritionistNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [originalNote, setOriginalNote] = useState('');
  const [pendingSkip, setPendingSkip] = useState(null);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [mealPlanHistory, setMealPlanHistory] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await fetch(`${PATIENT_API}/access-code-data/${accessCode}`);
        const data = await response.json();
        if (response.ok) {
          console.log("Received data:", data);
          setMealPlan({
            _id: data._id,
            prediction: data.prediction,
            progress: data.progress || {},
            mealAddons: data.mealAddons || {} // Include meal addons
          });
          setProgress(data.progress || {});
          setPatientData({
            firstName: data.firstName,
            lastName: data.lastName
          });
          setSkippedMeals(data.skippedMeals || {});
          setMealNotes(data.mealNotes || {});
          setNutritionistNotes(data.nutritionistNotes || {});
        } else {
          setError(data.error || 'Failed to fetch meal plan');
        }
      } catch (error) {
        console.error('Error fetching meal plan:', error);
        setError('Failed to fetch meal plan');
      }
    };

    fetchMealPlan();
  }, [accessCode]);

  useEffect(() => {
    fetchMealPlanHistory();
  }, [accessCode]);

  const fetchMealPlanHistory = async () => {
    if (!accessCode) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`${PATIENT_API}/access-code-history/${accessCode}`);
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        console.log("Meal plan history:", data);
        setMealPlanHistory(data);
        
        // If we have history and no current plan selected, set the most recent one
        if (data.length > 0 && !mealPlan) {
          const latestPlan = data[0];
          
          setMealPlan({
            _id: latestPlan._id,
            prediction: latestPlan.prediction,
            progress: latestPlan.progress || {},
            mealAddons: latestPlan.mealAddons || {}
          });
          
          setProgress(latestPlan.progress || {});
          setSkippedMeals(latestPlan.skippedMeals || {});
          setMealNotes(latestPlan.mealNotes || {});
          setNutritionistNotes(latestPlan.nutritionistNotes || {});
        }
      } else {
        console.error("Error fetching meal plan history:", data);
      }
    } catch (error) {
      console.error("Error fetching meal plan history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const switchMealPlan = (index) => {
    const selectedPlan = mealPlanHistory[index];
    setSelectedPlanIndex(index);
    
    // Make sure to update ALL relevant states with the historical data
    setMealPlan({
      _id: selectedPlan._id,
      prediction: selectedPlan.prediction || {},
      progress: selectedPlan.progress || {},
      skippedMeals: selectedPlan.skippedMeals || {},
      mealNotes: selectedPlan.mealNotes || {},
      nutritionistNotes: selectedPlan.nutritionistNotes || {},
      mealAddons: selectedPlan.mealAddons || {},
      createdAt: selectedPlan.createdAt || selectedPlan.date,
      TDEE: selectedPlan.TDEE,
      BMI: selectedPlan.BMI
    });
    
    // Also update the separate state variables to ensure UI consistency
    setProgress(selectedPlan.progress || {});
    setSkippedMeals(selectedPlan.skippedMeals || {});
    setMealNotes(selectedPlan.mealNotes || {});
    setNutritionistNotes(selectedPlan.nutritionistNotes || {});
  };

  const handleCheckMeal = async (day, meal) => {
    try {
        if (skippedMeals[day]?.[meal]) {
            return;
        }
        
        const currentProgress = progress[day]?.[meal] || false;
        const mealPlanId = mealPlan._id;
        
        let response;
        if (selectedPlanIndex === 0) {
            // Update current plan
            response = await fetch(`${PATIENT_API}/update-progress/${accessCode}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    day,
                    meal,
                    value: !currentProgress,
                }),
            });
        } else {
            // Update historical plan
            response = await fetch(`${PATIENT_API}/update-historical-meal-plan/${accessCode}/${mealPlanId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    day,
                    meal,
                    field: 'progress',
                    value: !currentProgress,
                }),
            });
        }

        if (response.ok) {
            const data = await response.json();
            
            if (selectedPlanIndex === 0) {
                setProgress(data.progress);
            } else {
                // Update the mealPlanHistory array with the updated data
                const updatedMealPlanHistory = [...mealPlanHistory];
                updatedMealPlanHistory[selectedPlanIndex] = {
                    ...updatedMealPlanHistory[selectedPlanIndex],
                    ...data
                };
                setMealPlanHistory(updatedMealPlanHistory);
                setProgress(data.progress);
            }
        } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to update progress');
        }
    } catch (error) {
        console.error('Error updating meal progress:', error);
        setError('Failed to update progress');
    }
};

  const handleSkipMeal = (day, meal) => {
    if (skippedMeals[day]?.[meal]) {
      confirmUnskipMeal(day, meal);
      return;
    }
    
    setPendingSkip({ day, meal });
    const updatedMealNotes = {...mealNotes};
    if (!updatedMealNotes[day]) {
      updatedMealNotes[day] = {};
    }
    if (!updatedMealNotes[day][meal]) {
      updatedMealNotes[day][meal] = '';
    }
    setMealNotes(updatedMealNotes);
    setEditingNote(`${day}-${meal}`);
    setOriginalNote('');
  };

  const confirmSkipMeal = async (day, meal) => {
    try {
        const updatedSkippedMeals = {...skippedMeals};
        if (!updatedSkippedMeals[day]) {
            updatedSkippedMeals[day] = {};
        }
        
        updatedSkippedMeals[day][meal] = true;
        
        // If meal was previously marked as completed, uncomplete it
        if (progress[day]?.[meal]) {
            // Use the appropriate endpoint based on whether we're viewing history
            if (selectedPlanIndex === 0) {
                // Current meal plan
                await fetch(`${PATIENT_API}/update-progress/${accessCode}`, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({day, meal, value: false})
                });
            } else {
                // Historical meal plan
                await fetch(`${PATIENT_API}/update-historical-meal-plan/${accessCode}/${mealPlan._id}`, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        day, 
                        meal, 
                        field: 'progress',
                        value: false
                    })
                });
            }
        }
        
        setSkippedMeals(updatedSkippedMeals);
        
        // Use appropriate endpoint based on whether we're viewing history
        let response;
        if (selectedPlanIndex === 0) {
            // Current meal plan
            response = await fetch(`${PATIENT_API}/update-meal-status/${accessCode}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    day,
                    meal,
                    note: mealNotes[day]?.[meal] || '',
                    skipped: true
                })
            });
        } else {
            // Historical meal plan
            response = await fetch(`${PATIENT_API}/update-historical-meal-plan/${accessCode}/${mealPlan._id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    day,
                    meal,
                    field: 'skippedMeals',
                    skipped: true,
                    note: mealNotes[day]?.[meal] || ''
                })
            });
        }
        
        // Update UI based on response
        if (response.ok) {
            const data = await response.json();
            if (selectedPlanIndex !== 0) {
                // Update history record with new data
                const updatedMealPlanHistory = [...mealPlanHistory];
                updatedMealPlanHistory[selectedPlanIndex] = {
                    ...updatedMealPlanHistory[selectedPlanIndex],
                    ...data
                };
                setMealPlanHistory(updatedMealPlanHistory);
            }
        } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to update meal status');
            updatedSkippedMeals[day][meal] = false;
            setSkippedMeals(updatedSkippedMeals);
        }
        
        setPendingSkip(null);
        setEditingNote(null);
    } catch (error) {
        console.error('Error updating meal status:', error);
        setError('Failed to update meal status');
        setPendingSkip(null);
    }
  };

  const confirmUnskipMeal = async (day, meal) => {
    try {
      const updatedSkippedMeals = {...skippedMeals};
      if (!updatedSkippedMeals[day]) {
        updatedSkippedMeals[day] = {};
      }
      
      updatedSkippedMeals[day][meal] = false;
      
      const updatedMealNotes = {...mealNotes};
      if (updatedMealNotes[day]) {
        updatedMealNotes[day][meal] = '';
        setMealNotes(updatedMealNotes);
      }
      
      setSkippedMeals(updatedSkippedMeals);
      
      const response = await fetch(`${PATIENT_API}/update-meal-status/${accessCode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day,
          meal,
          note: '',
          skipped: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update meal status');
        
        updatedSkippedMeals[day][meal] = true;
        setSkippedMeals(updatedSkippedMeals);
      }
    } catch (error) {
      console.error('Error updating meal status:', error);
      setError('Failed to update meal status');
    }
  };

  const cancelSkipMeal = () => {
    setPendingSkip(null);
    setEditingNote(null);
  };

  const handleNoteChange = (day, meal, note) => {
    const updatedMealNotes = {...mealNotes};
    if (!updatedMealNotes[day]) {
      updatedMealNotes[day] = {};
    }
    updatedMealNotes[day][meal] = note;
    setMealNotes(updatedMealNotes);
  };

  const startEditingNote = (day, meal) => {
    setEditingNote(`${day}-${meal}`);
    setOriginalNote(mealNotes[day]?.[meal] || '');
  };

  const cancelNoteEdit = (day, meal) => {
    const updatedMealNotes = {...mealNotes};
    if (!updatedMealNotes[day]) {
      updatedMealNotes[day] = {};
    }
    updatedMealNotes[day][meal] = originalNote;
    setMealNotes(updatedMealNotes);
    setEditingNote(null);
  };

  const confirmNote = async (day, meal) => {
    await saveNote(day, meal);
    setEditingNote(null);
  };

  const saveNote = async (day, meal) => {
    try {
        let response;
        if (selectedPlanIndex === 0) {
            // Current meal plan
            response = await fetch(`${PATIENT_API}/update-meal-notes/${accessCode}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    day,
                    meal,
                    note: mealNotes[day]?.[meal] || '',
                    skipped: skippedMeals[day]?.[meal] || false
                })
            });
        } else {
            // Historical meal plan
            response = await fetch(`${PATIENT_API}/update-historical-meal-plan/${accessCode}/${mealPlan._id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    day,
                    meal,
                    field: 'mealNotes',
                    note: mealNotes[day]?.[meal] || ''
                })
            });
        }
        
        if (response.ok && selectedPlanIndex !== 0) {
            const data = await response.json();
            // Update history record with new data
            const updatedMealPlanHistory = [...mealPlanHistory];
            updatedMealPlanHistory[selectedPlanIndex] = {
                ...updatedMealPlanHistory[selectedPlanIndex],
                ...data
            };
            setMealPlanHistory(updatedMealPlanHistory);
        } else if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to save note');
        }
    } catch (error) {
        console.error('Error saving note:', error);
        setError('Failed to save note');
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

  const handleAddonStatusChange = async (day, meal, addonIndex, completed, skipped) => {
    try {
        let response;
        if (selectedPlanIndex === 0) {
            // Current meal plan
            response = await fetch(`${PATIENT_API}/update-addon-status/${accessCode}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    day,
                    meal,
                    addonIndex,
                    completed,
                    skipped
                })
            });
        } else {
            // Historical meal plan
            response = await fetch(`${PATIENT_API}/update-historical-meal-plan/${accessCode}/${mealPlan._id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    day,
                    meal,
                    field: 'addonStatus',
                    addonIndex,
                    completed,
                    skipped
                })
            });
        }

        if (response.ok) {
            const data = await response.json();
            
            if (selectedPlanIndex === 0) {
                // Update current meal plan
                const updatedMealPlan = {...mealPlan};
                updatedMealPlan.mealAddons = data.mealAddons;
                setMealPlan(updatedMealPlan);
            } else {
                // Update history record with new data
                const updatedMealPlanHistory = [...mealPlanHistory];
                updatedMealPlanHistory[selectedPlanIndex] = {
                    ...updatedMealPlanHistory[selectedPlanIndex],
                    ...data
                };
                setMealPlanHistory(updatedMealPlanHistory);
                
                // Also update the current view
                const updatedMealPlan = {...mealPlan};
                updatedMealPlan.mealAddons = data.mealAddons;
                setMealPlan(updatedMealPlan);
            }
        } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to update addon status');
        }
    } catch (error) {
        console.error('Error updating addon status:', error);
        setError('Failed to update addon status');
    }
};

  if (!mealPlan) return <div>Loading...</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="meal-tracker">
      <h2>
        Meal Tracker
        {patientData?.firstName && patientData?.lastName ? 
          ` for ${patientData.firstName} ${patientData.lastName}` : 
          ''}
      </h2>

      {/* Meal Plan History Dropdown */}
      {mealPlanHistory.length > 1 && (
        <div className="meal-history-controls mb-6">
          <div className="flex items-center">
            <label htmlFor="history-select" className="mr-2 font-medium text-gray-700">
              Meal Plan History:
            </label>
            <div className="relative inline-block w-64">
              <select
                id="history-select"
                value={selectedPlanIndex}
                onChange={(e) => switchMealPlan(parseInt(e.target.value))}
                className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:border-green-500"
              >
                {mealPlanHistory.map((plan, index) => {
                  // Format date with time
                  const createdAt = new Date(plan.createdAt);
                  const formattedDate = createdAt.toLocaleDateString();
                  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <option key={plan._id} value={index}>
                      {formattedDate} at {formattedTime}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Display current meal plan date */}
      {mealPlan?.createdAt && (
        <div className="text-sm text-gray-600 mb-3">
          Created on: {formatDate(mealPlan.createdAt)}
        </div>
      )}

      {mealPlan && mealPlan.prediction ? (
        <div className="meal-grid">
          {days.map((day) => (
            <div key={day} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold mb-2">
                {day}
                {mealPlan.prediction[day]?.date && (
                  <span className="ml-1 text-xs font-normal">
                    {new Date(mealPlan.prediction[day].date).toLocaleDateString()}
                  </span>
                )}
              </h3>
              {meals.map((meal) => (
                <div 
                  key={`${day}-${meal}`} 
                  className={`meal-item ${
                    mealPlan.prediction[day]?.[meal] && !skippedMeals[day]?.[meal] && !pendingSkip 
                      ? "group cursor-pointer" 
                      : ""
                  }`}
                >
                  <div className="meal-controls">
                    <input
                      type="checkbox"
                      checked={progress[day]?.[meal] || false}
                      onChange={() => handleCheckMeal(day, meal)}
                      disabled={skippedMeals[day]?.[meal] || pendingSkip?.day === day && pendingSkip?.meal === meal}
                    />
                    <span className="meal-type">{meal}</span>
                  </div>
                  
                  <div 
                    className={`meal-desc flex flex-col bg-white p-3 rounded-lg shadow-sm border border-gray-100 ${
                      mealPlan.prediction[day]?.[meal] && !skippedMeals[day]?.[meal] && !pendingSkip 
                        ? "group-hover:bg-green-50 group-hover:border-green-200" 
                        : ""
                    }`}
                    onClick={() => {
                      if (mealPlan.prediction[day]?.[meal] && !skippedMeals[day]?.[meal] && !pendingSkip) {
                        fetchRecipeDetails(mealPlan.prediction[day][meal]);
                      }
                    }}
                  > 
                    <span 
                      className={mealPlan.prediction[day]?.[meal] && !skippedMeals[day]?.[meal] && !pendingSkip ? 
                        "text-green-600 w-full group-hover:text-green-700 transition-colors" : 
                        "text-gray-600 w-full"
                      }
                    >
                      {mealPlan.prediction[day]?.[meal] || 'No meal planned'}
                    </span>
                    
                    {/* Meal details moved below title */}
                    {mealPlan.prediction[day]?.[`${meal}_details`] && (
                      <div className="text-sm text-gray-600">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Base Calories</span>
                              <span className="font-medium">{mealPlan.prediction[day][`${meal}_details`].calories} kcal</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Prescribed serving</span>
                              <span className="font-medium">{mealPlan.prediction[day][`${meal}_details`].servings}</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Total Calories</span>
                              <span className="font-medium">{mealPlan.prediction[day][`${meal}_details`].total_calories} kcal</span>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                  
                  {/* Nutritionist Notes Section */}
                  {nutritionistNotes[day]?.[meal] && (
                    <div className="mt-2 p-3 text-sm bg-green-50 border border-green-100 rounded-lg shadow-sm">
                      <span className="flex items-center text-xs font-semibold text-green-800 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nutritionist Note:
                      </span>
                      <p className="text-gray-800">{nutritionistNotes[day][meal]}</p>
                    </div>
                  )}
                  
                  {/* Meal Addons Section */}
                  {mealPlan.mealAddons?.[day]?.[meal]?.length > 0 && (
                    <div className="meal-addons mt-3">
                      <h4 className="text-sm font-medium">Additional Items:</h4>
                      {mealPlan.mealAddons[day][meal].map((addon, idx) => (
                        <div key={idx} className="flex items-center mt-2 p-2 bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={addon.completed}
                            onChange={() => handleAddonStatusChange(day, meal, idx, !addon.completed, addon.skipped)}
                            disabled={addon.skipped}
                            className="mr-2"
                          />
                          <span className={`flex-grow ${addon.skipped ? 'line-through text-gray-400' : addon.completed ? 'text-green-600' : ''}`}>
                            {addon.text}
                          </span>
                          <button 
                            className={`text-xs px-2 py-1 rounded ${
                              addon.skipped 
                                ? 'bg-gray-300 hover:bg-gray-400' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                            onClick={() => handleAddonStatusChange(day, meal, idx, addon.completed, !addon.skipped)}
                          >
                            {addon.skipped ? 'Unskip' : 'Skip'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    className={`skip-button ${skippedMeals[day]?.[meal] ? 'skipped' : ''} ${pendingSkip?.day === day && pendingSkip?.meal === meal ? 'pending' : ''}`}
                    onClick={() => handleSkipMeal(day, meal)}
                    disabled={pendingSkip && (pendingSkip.day !== day || pendingSkip.meal !== meal)}
                  >
                    {skippedMeals[day]?.[meal] ? 'Unskip' : 'Skip'}
                  </button>
                  
                  {(skippedMeals[day]?.[meal] || (pendingSkip?.day === day && pendingSkip?.meal === meal)) && (
                    <div className="meal-notes">
                      <textarea
                        placeholder="Why did you skip? What did you eat instead?"
                        value={mealNotes[day]?.[meal] || ''}
                        onChange={(e) => handleNoteChange(day, meal, e.target.value)}
                        onFocus={() => !pendingSkip && startEditingNote(day, meal)}
                        className="meal-notes-input"
                      />
                      
                      {((pendingSkip?.day === day && pendingSkip?.meal === meal) || 
                        (editingNote === `${day}-${meal}` && !pendingSkip)) && (
                        <div className="note-buttons">
                          <button 
                            className="note-button cancel"
                            onClick={() => pendingSkip ? cancelSkipMeal() : cancelNoteEdit(day, meal)}
                          >
                            Cancel
                          </button>
                          <button 
                            className="note-button confirm"
                            onClick={() => pendingSkip ? confirmSkipMeal(day, meal) : confirmNote(day, meal)}
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div>No meal plan available</div>
      )}
      {error && <div className="error">{error}</div>}
      {recipeModalOpen && selectedRecipe && (
        <RecipeCard 
          recipe={selectedRecipe}
          initialOpen={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GuestMealTrackerDisplay;