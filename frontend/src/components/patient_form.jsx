import { useState } from "react";
import { usePatientContext } from "../hooks/use_patient_context";
import { useAuthStore } from "../store/authStore";

const PatientForm = () => {
  const { dispatch } = usePatientContext();
  const { user } = useAuthStore(); // Ensure user is available

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [preference, setPreference] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user exists and has _id
    if (!user || !user._id) {
      setError('User not authenticated');
      return;
    }

    const patient = {
      age,
      weight,
      height,
      gender,
      activity_level: activityLevel,
      preference: preference || "None",
      restrictions: restrictions || "None",
      userId: user._id // Ensure this is being sent
    };

    try {
      const response = await fetch('/api/patient_routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`, // Add this line
        },
        body: JSON.stringify(patient),
        credentials: 'include'
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
        setEmptyFields(json.emptyFields || []);
      } else {
        setError(null);
        setEmptyFields([]);
        dispatch({ type: 'CREATE_PATIENT', payload: json });
        // Reset form fields
        setAge('');
        setWeight('');
        setHeight('');
        setGender('');
        setActivityLevel('');
        setPreference('');
        setRestrictions('');
        setMealPlan(json.prediction);// Set the meal plan
      }
    } catch (error) {
      setError('Failed to submit form');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Age:</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={emptyFields.includes('age') ? 'error' : ''}
          required
        />

        <label>Weight (kg):</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className={emptyFields.includes('weight') ? 'error' : ''}
          required
        />

        <label>Height (cm):</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className={emptyFields.includes('height') ? 'error' : ''}
          required
        />

        <label>Gender:</label>
        <select
          type="text"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={emptyFields.includes('gender') ? 'error' : ''}
          required
        >
          <option value="">Select Gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>

        </select>

        <label>Activity Level:</label>
        <select
          value={activityLevel}
          onChange={(e) => setActivityLevel(e.target.value)}
          className={emptyFields.includes('activity level') ? 'error' : ''}
          required
        >
          <option value="">Select activity level</option>
          <option value="1.2">Sedentary</option>
          <option value="1.4">Lightly Active</option>
          <option value="1.5">Moderately Active</option>
          <option value="1.7">Very Active</option>
          <option value="1.9">Extra Active</option>
        </select>

        <label>Dietary Preference:</label>
        <select
          type="text"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          className={emptyFields.includes('preference') ? 'error' : ''}
        >
          <option value="">None</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Low-Purine">Low-Purine</option>
          <option value="Low-Fat/Heart-Healthy">Low-Fat/Heart-Healthy</option>
          <option value="Low-Sodium">Low-Sodium</option>
        </select>

        <label>Restrictions:</label>
        <select
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
          className={emptyFields.includes('restrictions') ? 'error' : ''}
        >
          <option value="None">None</option>
          <option value="Lactose Free">Lactose Free</option>
          <option value="Peanut Allergy">Peanut Allergy</option>
          <option value="Shellfish Allergy">Shellfish Allergy</option>
          <option value="Halal">Halal</option>
        </select>

        <button type="submit">Generate</button>
        {error && <div className="error">{error}</div>}
      </form>

      {mealPlan && (
        <div className="meal-plan">
          <h3>Generated Meal Plan</h3>
          <pre>{JSON.stringify(mealPlan, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PatientForm;