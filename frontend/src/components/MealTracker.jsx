import { useState, useEffect } from 'react';
import { useAuthStore } from "../store/authStore";
import { PATIENT_API, RECIPES_API } from '../config/api';
import RecipeCard from "./RecipeCard.jsx";

const MealTracker = () => {
  const { user } = useAuthStore();
  const [mealPlan, setMealPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [skippedMeals, setSkippedMeals] = useState({});
  const [mealNotes, setMealNotes] = useState({});
  const [error, setError] = useState(null);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [originalNote, setOriginalNote] = useState('');
  const [pendingSkip, setPendingSkip] = useState(null);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState(1.2);

  // New state variables for history functionality
  const [mealPlanHistory, setMealPlanHistory] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchMealPlan = async () => {
        if (!user) {
            console.log("No user found");
            return;
        }

        try {
            const response = await fetch(`${PATIENT_API}/user-meal-plans`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log("Raw API Response:", data);

            if (response.ok && Array.isArray(data) && data.length > 0) {
                const latestPlan = data[0];
                console.log("Setting meal plan with:", latestPlan);

                if (latestPlan.prediction && latestPlan._id) {
                  const parsedPrediction = typeof latestPlan.prediction === 'string' 
                      ? JSON.parse(latestPlan.prediction.replace(/'/g, '"')) 
                      : latestPlan.prediction;

                  setMealPlan({
                      _id: latestPlan._id,
                      prediction: parsedPrediction,
                      progress: latestPlan.progress || {},
                      TDEE: latestPlan.TDEE,
                      BMI: latestPlan.BMI
                  });

                  setProgress(latestPlan.progress || {});
                  setSkippedMeals(latestPlan.skippedMeals || {});
                  setMealNotes(latestPlan.mealNotes || {});
                } else {
                    console.error("Invalid meal plan structure:", latestPlan);
                    setError('Invalid meal plan data structure');
                }
            } else {
                setError(data.error || 'No meal plan found');
                console.error("Error response or empty data:", data);
            }
        } catch (error) {
            console.error("Error fetching meal plan:", error);
            setError('Failed to fetch meal plan');
        }
    };

    fetchMealPlan();
}, [user]);

  useEffect(() => {
      console.log("Current mealPlan:", mealPlan);
      console.log("Current progress:", progress);
  }, [mealPlan, progress]);

  // New function to fetch meal plan history
  const fetchMealPlanHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`${PATIENT_API}/user-meal-plans/history`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        console.log("Meal plan history:", data);
        setMealPlanHistory(data);
        
        // If we have history and no current plan selected, set the most recent one
        if (data.length > 0 && !mealPlan) {
          const latestPlan = data[0];
          
          const parsedPrediction = typeof latestPlan.prediction === 'string' 
            ? JSON.parse(latestPlan.prediction.replace(/'/g, '"')) 
            : latestPlan.prediction;
            
          setMealPlan({
            _id: latestPlan._id,
            prediction: parsedPrediction,
            progress: latestPlan.progress || {},
            TDEE: latestPlan.TDEE,
            BMI: latestPlan.BMI,
            createdAt: latestPlan.createdAt
          });
          
          setProgress(latestPlan.progress || {});
          setSkippedMeals(latestPlan.skippedMeals || {});
          setMealNotes(latestPlan.mealNotes || {});
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

  // Function to switch between meal plans in history
  const switchMealPlan = (index) => {
    if (index >= 0 && index < mealPlanHistory.length) {
      const selectedPlan = mealPlanHistory[index];
      
      const parsedPrediction = typeof selectedPlan.prediction === 'string' 
        ? JSON.parse(selectedPlan.prediction.replace(/'/g, '"')) 
        : selectedPlan.prediction;
        
      setMealPlan({
        _id: selectedPlan._id,
        prediction: parsedPrediction,
        progress: selectedPlan.progress || {},
        TDEE: selectedPlan.TDEE,
        BMI: selectedPlan.BMI,
        createdAt: selectedPlan.createdAt
      });
      
      setProgress(selectedPlan.progress || {});
      setSkippedMeals(selectedPlan.skippedMeals || {});
      setMealNotes(selectedPlan.mealNotes || {});
      setSelectedPlanIndex(index);
    }
  };

  // Call fetchMealPlanHistory in useEffect hook
  useEffect(() => {
    fetchMealPlanHistory();
  }, [user]);

  // Format date for displaying meal plan creation date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  const handleCheckMeal = async (day, meal) => {
    try {
        const currentProgress = progress[day]?.[meal] || false;
        
        const response = await fetch(`${PATIENT_API}/${mealPlan._id}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            credentials: 'include',
            body: JSON.stringify({ 
                day, 
                meal,
                value: !currentProgress
            })
        });

        if (response.ok) {
            const data = await response.json();
            setProgress(data.progress);
        } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to update progress');
        }

        if (skippedMeals[day]?.[meal]) {
          const updatedSkippedMeals = {...skippedMeals};
          if (updatedSkippedMeals[day]) {
            updatedSkippedMeals[day][meal] = false;
            setSkippedMeals(updatedSkippedMeals);
          }
        }
    } catch (error) {
        console.error("Error updating meal progress:", error);
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
      
      if (progress[day]?.[meal]) {
        await handleCheckMeal(day, meal);
      }
      
      setSkippedMeals(updatedSkippedMeals);
      
      await updateMealStatus(day, meal);
      
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
                    note: '',
                    skipped: false
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
                    skipped: false,
                    note: ''
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

  const handleNoteChange = (day, meal, note) => {
    const updatedMealNotes = {...mealNotes};
    if (!updatedMealNotes[day]) {
      updatedMealNotes[day] = {};
    }
    updatedMealNotes[day][meal] = note;
    setMealNotes(updatedMealNotes);
  };

  const saveNote = async (day, meal) => {
    try {
      const response = await fetch(`${PATIENT_API}/${mealPlan._id}/meal-notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          day, 
          meal,
          note: mealNotes[day]?.[meal] || '',
          skipped: skippedMeals[day]?.[meal] || false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save note');
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setError('Failed to save note');
    }
  };

  const updateMealStatus = async (day, meal) => {
    try {
      if (!mealPlan?._id) {
        console.error("No meal plan ID available");
        return;
      }
      
      const isSkipped = skippedMeals[day]?.[meal] || false;
      const noteValue = isSkipped ? (mealNotes[day]?.[meal] || '') : '';
      
      const response = await fetch(`${PATIENT_API}/${mealPlan._id}/meal-notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          day,
          meal,
          note: noteValue,
          skipped: isSkipped
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSkippedMeals(data.skippedMeals);
        setMealNotes(data.mealNotes);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update meal status');
        const updatedSkippedMeals = {...skippedMeals};
        if (updatedSkippedMeals[day]) {
          updatedSkippedMeals[day][meal] = !updatedSkippedMeals[day][meal];
          setSkippedMeals(updatedSkippedMeals);
        }
      }
    } catch (error) {
      console.error("Error updating meal status:", error);
      setError('Failed to update meal status');
      const updatedSkippedMeals = {...skippedMeals};
      if (updatedSkippedMeals[day]) {
        updatedSkippedMeals[day][meal] = !updatedSkippedMeals[day][meal];
        setSkippedMeals(updatedSkippedMeals);
      }
    }
  };

  const fetchRecipeDetails = async (mealName) => {
    if (!mealName) return;
    
    setLoadingRecipe(true);
    try {
      const response = await fetch(`${RECIPES_API}/title/${encodeURIComponent(mealName)}`);
      if (response.ok) {
        const recipeData = await response.json();

        console.log('Recipe data:', recipeData); 

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

  if (!mealPlan) return <div>Loading...</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="meal-tracker">
        <h2>Weekly Meal Tracker</h2>

        {/* Meal Plan History Dropdown */}
        {mealPlanHistory.length > 0 && (
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
        
        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200"> 
          {/* Display current meal plan date */}
          {mealPlan?.createdAt && (
            <div className="text-sm text-gray-600 mb-3">
              Created on: {formatDate(mealPlan.createdAt)}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
            <div className="flex items-center"> 
              <div className="bg-green-100 p-3 rounded-full mr-3"> 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /> 
                </svg> 
              </div> 
              <div> 
                <h4 className="text-lg font-semibold text-gray-800">TDEE (Total Daily Energy Expenditure)</h4> 
                <p className="text-gray-600">
                  {mealPlan?.TDEE || "Not available"} 
                </p>
              </div> 
            </div> 
            <div className="flex items-center"> 
              <div className="bg-green-100 p-3 rounded-full mr-3"> 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> 
                </svg> 
              </div> 
              <div> 
                <h4 className="text-lg font-semibold text-gray-800">BMI (Body Mass Index)</h4> 
                <p className="text-gray-600">
                  {mealPlan?.BMI || "Not available"}
                </p>
              </div> 
            </div> 
          </div> 
          <div className="mt-3 text-sm text-gray-500"> 
            <p>This meal plan is designed based on your calculated energy needs and body composition.</p> 
          </div> 
        </div>

        {mealPlan && mealPlan.prediction ? (
          <div className="meal-grid">
            {days.map((day) => (
              <div key={day} className="day-card">
                <h3>
                  {day}
                  {mealPlan.prediction[day]?.date && (
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(mealPlan.prediction[day].date).toLocaleDateString()}
                    </span>
                  )}
                </h3>

                {meals.map((meal) => (
                  <div key={`${day}-${meal}`} className="meal-item">
                    
                    {/* Meal Controls */}
                    <div className="meal-controls">
                      <input
                        type="checkbox"
                        checked={progress[day]?.[meal] || false}
                        onChange={() => handleCheckMeal(day, meal)}
                        disabled={
                          skippedMeals[day]?.[meal] ||
                          (pendingSkip?.day === day && pendingSkip?.meal === meal)
                        }
                      />
                      <span className="meal-type">{meal}</span>
                    </div>

                    {/* Meal Description */}
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
                      style={{
                        cursor: mealPlan.prediction[day]?.[meal] && !skippedMeals[day]?.[meal] && !pendingSkip
                          ? 'pointer'
                          : 'default',
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
                      
                      {/* Meal nutrition details */}
                      {mealPlan.prediction[day]?.[`${meal}_details`] && (
                        <div className="text-sm text-gray-600 mt-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Base Calories</span>
                              <span className="font-medium">{mealPlan.prediction[day][`${meal}_details`].calories} kcal</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Servings</span>
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

                    {/* Skip Button */}
                    <button
                      className={`skip-button ${
                        skippedMeals[day]?.[meal] ? 'skipped' : ''
                      } ${
                        pendingSkip?.day === day && pendingSkip?.meal === meal
                          ? 'pending'
                          : ''
                      }`}
                      onClick={() => handleSkipMeal(day, meal)}
                      disabled={
                        pendingSkip &&
                        (pendingSkip.day !== day || pendingSkip.meal !== meal)
                      }
                    >
                      {skippedMeals[day]?.[meal] ? 'Unskip' : 'Skip'}
                    </button>

                    {/* Meal Notes */}
                    {(skippedMeals[day]?.[meal] ||
                      (pendingSkip?.day === day && pendingSkip?.meal === meal)) && (
                      <div className="meal-notes">
                        <textarea
                          placeholder="Why did you skip? What did you eat instead?"
                          value={mealNotes[day]?.[meal] || ''}
                          onChange={(e) => handleNoteChange(day, meal, e.target.value)}
                          onFocus={() => !pendingSkip && startEditingNote(day, meal)}
                          className="meal-notes-input"
                        />

                        {(pendingSkip?.day === day && pendingSkip?.meal === meal) ||
                        (editingNote === `${day}-${meal}` && !pendingSkip) ? (
                          <div className="note-buttons">
                            <button
                              className="note-button cancel"
                              onClick={() =>
                                pendingSkip
                                  ? cancelSkipMeal()
                                  : cancelNoteEdit(day, meal)
                              }
                            >
                              Cancel
                            </button>
                            <button
                              className="note-button confirm"
                              onClick={() =>
                                pendingSkip
                                  ? confirmSkipMeal(day, meal)
                                  : confirmNote(day, meal)
                              }
                            >
                              Confirm
                            </button>
                          </div>
                        ) : null}
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
            initialOpen={true} 
            onClose={() => setRecipeModalOpen(false)}
          />
        )}
    </div>
  );
};

export default MealTracker;