import { useState, useEffect } from 'react';
import { useAuthStore } from "../store/authStore";

const MealTracker = () => {
  const { user } = useAuthStore();
  const [mealPlan, setMealPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [skippedMeals, setSkippedMeals] = useState({});
  const [mealNotes, setMealNotes] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMealPlan = async () => {
        if (!user) {
            console.log("No user found");
            return;
        }

        try {
            const response = await fetch('/api/patient_routes/user-meal-plans', {
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
      
      const response = await fetch(`/api/patient_routes/${mealPlan._id}/progress`, {
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

const handleSkipMeal = async (day, meal) => {
  try {
    const updatedSkippedMeals = {...skippedMeals};
    if (!updatedSkippedMeals[day]) {
      updatedSkippedMeals[day] = {};
    }
    
    // Toggle the skipped status
    const newSkippedStatus = !updatedSkippedMeals[day][meal];
    updatedSkippedMeals[day][meal] = newSkippedStatus;
    
    // If we're unskipping, also clear the note
    if (!newSkippedStatus) {
      const updatedMealNotes = {...mealNotes};
      if (updatedMealNotes[day]) {
        updatedMealNotes[day][meal] = '';
        setMealNotes(updatedMealNotes);
      }
    }
    
    setSkippedMeals(updatedSkippedMeals);
    
    if (progress[day]?.[meal]) {
      await handleCheckMeal(day, meal);
    }
    
    await updateMealStatus(day, meal);
  } catch (error) {
    console.error("Error skipping meal:", error);
    setError('Failed to update meal status');
  }
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
    const response = await fetch(`/api/patient_routes/${mealPlan._id}/meal-notes`, {
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
    
    // Get the current status after state updates
    const isSkipped = skippedMeals[day]?.[meal] || false;
    const noteValue = isSkipped ? (mealNotes[day]?.[meal] || '') : '';
    
    // Send the updated skipped status to the backend
    const response = await fetch(`/api/patient_routes/${mealPlan._id}/meal-notes`, {
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
      // Update states with the response data
      const data = await response.json();
      setSkippedMeals(data.skippedMeals);
      setMealNotes(data.mealNotes);
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'Failed to update meal status');
      // If the API call fails, revert the skipped status
      const updatedSkippedMeals = {...skippedMeals};
      if (updatedSkippedMeals[day]) {
        updatedSkippedMeals[day][meal] = !updatedSkippedMeals[day][meal];
        setSkippedMeals(updatedSkippedMeals);
      }
    }
  } catch (error) {
    console.error("Error updating meal status:", error);
    setError('Failed to update meal status');
    // If there's an error, revert the skipped status
    const updatedSkippedMeals = {...skippedMeals};
    if (updatedSkippedMeals[day]) {
      updatedSkippedMeals[day][meal] = !updatedSkippedMeals[day][meal];
      setSkippedMeals(updatedSkippedMeals);
    }
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
              {days.map(day => (
                  <div key={day} className="day-card">
                      <h3>{day}</h3>
                      {meals.map(meal => (
                          <div key={`${day}-${meal}`} className="meal-item">
                              <div className="meal-controls">
                                  <input
                                      type="checkbox"
                                      checked={progress[day]?.[meal] || false}
                                      onChange={() => handleCheckMeal(day, meal)}
                                      disabled={skippedMeals[day]?.[meal]}
                                  />
                                  <span className="meal-type">{meal}</span>
                              </div>
                              
                              <p className="meal-desc">
                                  {mealPlan.prediction[day]?.[meal] || 'No meal planned'}
                              </p>
                              
                              <button 
                                  className={`skip-button ${skippedMeals[day]?.[meal] ? 'skipped' : ''}`}
                                  onClick={() => handleSkipMeal(day, meal)}
                              >
                                  {skippedMeals[day]?.[meal] ? 'Unskip' : 'Skip'}
                              </button>
                              
                              {skippedMeals[day]?.[meal] && (
                                  <div className="meal-notes">
                                      <textarea
                                          placeholder="Why did you skip? What did you eat instead?"
                                          value={mealNotes[day]?.[meal] || ''}
                                          onChange={(e) => handleNoteChange(day, meal, e.target.value)}
                                          onBlur={() => saveNote(day, meal)}
                                          className="meal-notes-input"
                                      />
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
  </div>
);
};

export default MealTracker;