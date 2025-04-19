import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const GuestMealTrackerDisplay = () => {
  const { accessCode } = useParams();
  const [mealPlan, setMealPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [skippedMeals, setSkippedMeals] = useState({});
  const [mealNotes, setMealNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [originalNote, setOriginalNote] = useState('');
  const [pendingSkip, setPendingSkip] = useState(null);

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
          setSkippedMeals(data.skippedMeals || {});
          setMealNotes(data.mealNotes || {});
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
      if (skippedMeals[day]?.[meal]) {
        return;
      }
      
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
        const response = await fetch(`/api/patient_routes/update-progress/${accessCode}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            day,
            meal,
            value: false,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
        }
      }
      
      setSkippedMeals(updatedSkippedMeals);
      
      const response = await fetch(`/api/patient_routes/update-meal-status/${accessCode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day,
          meal,
          note: mealNotes[day]?.[meal] || '',
          skipped: true
        })
      });
      
      if (!response.ok) {
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
      
      const response = await fetch(`/api/patient_routes/update-meal-status/${accessCode}`, {
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
      const response = await fetch(`/api/patient_routes/update-meal-notes/${accessCode}`, {
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

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note');
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
      {mealPlan && mealPlan.prediction ? (
        <div className="meal-grid">
          {days.map((day) => (
            <div key={day} className="day-card">
              <h3>{day}</h3>
              {meals.map((meal) => (
                <div key={`${day}-${meal}`} className="meal-item">
                  <div className="meal-controls">
                    <input
                      type="checkbox"
                      checked={progress[day]?.[meal] || false}
                      onChange={() => handleCheckMeal(day, meal)}
                      disabled={skippedMeals[day]?.[meal] || pendingSkip?.day === day && pendingSkip?.meal === meal}
                    />
                    <span className="meal-type">{meal}</span>
                  </div>
                  
                  <p className="meal-desc">
                    {mealPlan.prediction[day]?.[meal] || 'No meal planned'}
                  </p>
                  
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
    </div>
  );
};

export default GuestMealTrackerDisplay;