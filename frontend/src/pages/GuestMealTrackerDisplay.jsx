import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const GuestMealTrackerDisplay = () => {
  const { accessCode } = useParams();
  const [mealPlan, setMealPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await fetch(`/api/patient_routes/access-code-data/${accessCode}`);
        const data = await response.json();
        if (response.ok) {
          setMealPlan({
            _id: data._id,
            prediction: data.prediction,
            progress: data.progress || {},
          });
          setProgress(data.progress || {});
          setPatientData({
            firstName: data.firstName,
            lastName: data.lastName
          });
          setProgress(data.progress || {});
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

  const handleCheckMeal = async (day, meal) => {
    try {
      const currentProgress = progress[day]?.[meal] || false;

      const response = await fetch(`/api/patient_routes/update-progress/${accessCode}`, {
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

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating meal progress:', error);
      setError('Failed to update progress');
    }
  };

  if (!mealPlan) return <div>Loading...</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="meal-tracker">
      <h2>          Meal Tracker
          {patientData?.firstName && patientData?.lastName ? 
            ` for ${patientData.firstName} ${patientData.lastName}` : 
            ''}</h2>
      {mealPlan && mealPlan.prediction ? (
        <div className="meal-grid">
          {days.map((day) => (
            <div key={day} className="day-card">
              <h3>{day}</h3>
              {meals.map((meal) => (
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

export default GuestMealTrackerDisplay;