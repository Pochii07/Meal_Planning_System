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

    const patientData = {
      age,
      height,
      weight,
      gender,
      activity_level: activityLevel,  
      preference: preference || "None",
      restrictions: restrictions || "None"
    };

    try {
      // Different endpoints for guest vs authenticated users
      const endpoint = user ? '/api/patient_routes' : '/api/patient_routes/guest-predict';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify(user ? { ...patientData, userId: user._id } : patientData),
        credentials: user ? 'include' : 'omit'
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
        setEmptyFields(json.emptyFields || []);
      } else {
        setError(null);
        setEmptyFields([]);
        
        // For authenticated users, update context
        if (user) {
          dispatch({ type: 'CREATE_PATIENT', payload: json });
        }
        
        // Set meal plan for both guest and authenticated users
        setMealPlan(user ? json.prediction : json.prediction);
      }
    } catch (error) {
      setError('Failed to submit form');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Form Section */}
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Generate Meal Plan</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Age Input */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  emptyFields.includes('age') ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>

            {/* Weight Input */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  emptyFields.includes('weight') ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>

            {/* Height Input */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  emptyFields.includes('height') ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>

            {/* Gender Select */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  emptyFields.includes('gender') ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          {/* Activity Level Select */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                emptyFields.includes('activity_level') ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select activity level</option>
              <option value="1.2">Sedentary</option>
              <option value="1.4">Lightly Active</option>
              <option value="1.5">Moderately Active</option>
              <option value="1.7">Very Active</option>
              <option value="1.9">Extra Active</option>
            </select>
          </div>

          {/* Dietary Preference Select */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preference</label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                emptyFields.includes('preference') ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">None</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Low-Purine">Low-Purine</option>
              <option value="Low-Fat/Heart-Healthy">Low-Fat/Heart-Healthy</option>
              <option value="Low-Sodium">Low-Sodium</option>
            </select>
          </div>

          {/* Restrictions Select */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Restrictions</label>
            <select
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                emptyFields.includes('restrictions') ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="None">None</option>
              <option value="Lactose Free">Lactose Free</option>
              <option value="Peanut Allergy">Peanut Allergy</option>
              <option value="Shellfish Allergy">Shellfish Allergy</option>
              <option value="Halal">Halal</option>
            </select>
          </div>

          {error && (
            <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 font-medium"
          >
            Generate Meal Plan
          </button>
        </form>
      </div>

      {/* Meal Plan Section */}
      {mealPlan && (
        <div className="max-w-7xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-lg">
          <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Weekly Meal Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(mealPlan).map(([day, meals]) => (
              <div key={day} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-2xl font-semibold text-green-600 mb-6 border-b border-gray-200 pb-2 text-center">
                  {day}
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-lg font-semibold text-green-600 mb-2">Breakfast</h5>
                    <p className="text-gray-700 bg-white p-4 rounded-md shadow-sm">{meals.breakfast}</p>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-green-600 mb-2">Lunch</h5>
                    <p className="text-gray-700 bg-white p-4 rounded-md shadow-sm">{meals.lunch}</p>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-green-600 mb-2">Dinner</h5>
                    <p className="text-gray-700 bg-white p-4 rounded-md shadow-sm">{meals.dinner}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientForm;