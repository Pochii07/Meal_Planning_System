import { useState, useEffect } from 'react';
import { useAuthStore } from "../store/authStore";

const MealTracker = () => {
  const { user } = useAuthStore();
  const [mealPlan, setMealPlan] = useState(null);
  const [progress, setProgress] = useState({});
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
                    // Parse the prediction if it's a string
                    const parsedPrediction = typeof latestPlan.prediction === 'string' 
                        ? JSON.parse(latestPlan.prediction.replace(/'/g, '"')) 
                        : latestPlan.prediction;

                    setMealPlan({
                        _id: latestPlan._id,
                        prediction: parsedPrediction,
                        progress: latestPlan.progress || {}
                    });
                    setProgress(latestPlan.progress || {});
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

// Add debug output
useEffect(() => {
    console.log("Current mealPlan:", mealPlan);
    console.log("Current progress:", progress);
}, [mealPlan, progress]);

const handleCheckMeal = async (day, meal) => {
  try {
      // Get current state of the meal progress
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
              value: !currentProgress // Toggle the current value
          })
      });

      if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
      } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to update progress');
      }
  } catch (error) {
      console.error("Error updating meal progress:", error);
      setError('Failed to update progress');
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
                                <input
                                    type="checkbox"
                                    checked={progress[day]?.[meal] || false}
                                    onChange={() => handleCheckMeal(day, meal)}
                                />
                                <span className="meal-type">{meal}</span>
                                <p className="meal-desc">
                                    {mealPlan.prediction[day]?.[meal] || 'No meal planned'}
                                </p>
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