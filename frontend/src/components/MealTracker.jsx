import { useState, useEffect } from 'react';
import { useAuthStore } from "../store/authStore";
import { PATIENT_API, RECIPES_API } from '../config/api';

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
                        progress: latestPlan.progress || {}
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
    
    await updateMealStatus(day, meal);
    
    setPendingSkip(null);
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
                    className="meal-desc flex items-center"
                    onClick={() => {
                      if (
                        mealPlan.prediction[day]?.[meal] &&
                        !skippedMeals[day]?.[meal] &&
                        !pendingSkip
                      ) {
                        fetchRecipeDetails(mealPlan.prediction[day][meal]);
                      }
                    }}
                    style={{
                      cursor:
                        mealPlan.prediction[day]?.[meal] &&
                        !skippedMeals[day]?.[meal] &&
                        !pendingSkip
                          ? 'pointer'
                          : 'default',
                    }}
                  >
                    <span
                      className={
                        mealPlan.prediction[day]?.[meal] &&
                        !skippedMeals[day]?.[meal] &&
                        !pendingSkip
                          ? "text-green-600 hover:text-green-800 hover:underline transition-colors flex-grow"
                          : "text-gray-600 flex-grow"
                      }
                    >
                      {mealPlan.prediction[day]?.[meal] || 'No meal planned'}
                    </span>
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
        <div 
          className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRecipeModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 relative max-h-[80vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
              onClick={() => setRecipeModalOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2 pr-8">{selectedRecipe.title}</h2>
            
            <div className="mb-3">
              <p className="text-gray-600 text-sm">{selectedRecipe.summary}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Prep Time</span>
                <span className="font-medium text-sm">{selectedRecipe.prep_time}</span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Cook Time</span>
                <span className="font-medium text-sm">{selectedRecipe.cook_time}</span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Servings</span>
                <span className="font-medium text-sm">{selectedRecipe.servings}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="text-md font-semibold mb-1">Ingredients</h3>
              <div className="bg-gray-50 p-3 rounded">
                <ul className="list-disc pl-5 space-y-0.5 text-sm">
                  {selectedRecipe.ingredients.split(',').map((ingredient, idx) => (
                    <li key={idx}>{ingredient.trim()}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="text-md font-semibold mb-1">Instructions</h3>
              <div className="bg-gray-50 p-3 rounded">
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  {selectedRecipe.instructions.split('.').filter(step => step.trim()).map((step, idx) => (
                    <li key={idx}>{step.trim()}.</li>
                  ))}
                </ol>
              </div>
            </div>
            
            <div className="mb-3">
              <h3 className="text-md font-semibold mb-1">Nutrition Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-xs text-gray-500">Calories</span>
                  <span className="font-medium text-sm">{selectedRecipe.calories}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-xs text-gray-500">Carbs</span>
                  <span className="font-medium text-sm">{selectedRecipe.carbohydrates}g</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-xs text-gray-500">Protein</span>
                  <span className="font-medium text-sm">{selectedRecipe.protein}g</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="block text-xs text-gray-500">Fat</span>
                  <span className="font-medium text-sm">{selectedRecipe.fat}g</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                onClick={() => setRecipeModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
);
};

export default MealTracker;