import { useState } from "react";
import { usePatientContext } from "../hooks/use_patient_context";

const PatientForm = () => {
  const { dispatch } = usePatientContext();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [preference, setPreference] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const patient = {
      age,
      weight,
      height,
      gender,
      activity_level: activityLevel,
      preference: preference || null,
      restrictions: restrictions || null,
    };

    const response = await fetch('/api/patient_routes', {
      method: 'POST',
      body: JSON.stringify(patient),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
      setEmptyFields(json.emptyFields || []);
    } else {
      setError(null);
      setEmptyFields([]);
      dispatch({ type: 'CREATE_PATIENT', payload: json });
      setAge('');
      setWeight('');
      setHeight('');
      setGender('');
      setActivityLevel('');
      setPreference('');
      setRestrictions('');
    }
  };

  return (
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
      <input
        type="text"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className={emptyFields.includes('gender') ? 'error' : ''}
        required
      />

      <label>Activity Level:</label>
      <input
        type="number"
        value={activityLevel}
        onChange={(e) => setActivityLevel(e.target.value)}
        className={emptyFields.includes('activity level') ? 'error' : ''}
        required
      />

      <label>Dietary Preference:</label>
      <input
        type="text"
        value={preference}
        onChange={(e) => setPreference(e.target.value)}
        className={emptyFields.includes('preference') ? 'error' : ''}
      />

      <label>Allergies:</label>
      <input
        type="text"
        value={restrictions}
        onChange={(e) => setRestrictions(e.target.value)}
        className={emptyFields.includes('restrictions') ? 'error' : ''}
      />

      <button type="submit">Add Patient</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default PatientForm;