import { useState, useEffect } from "react";
import { usePatientContext } from "../hooks/use_patient_context";
import { useAuthStore } from "../store/authStore";
import { PATIENT_API } from '../config/api';

const DIETARY_PREFERENCES = [
  "Vegetarian",
  "Low-Purine",
  "Low-Fat/Heart-Healthy",
  "Low-Sodium"
];

const DIETARY_RESTRICTIONS = [
  "Lactose Free",
  "Peanut Allergy",
  "Shellfish Allergy",
  "Halal"
];

const PatientForm = () => {
  const { dispatch } = usePatientContext();
  const { user } = useAuthStore();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  useEffect(() => {
    if (user) {
      const userAge = calculateAge(user.birthDate);
      setAge(userAge);
        
      const userGender = user.sex === 'Male' ? 'M' : 'F';
      setGender(userGender);
    } else {
      setAge('');
      setGender('');
    }
  }, [user]);

  const handlePreferenceChange = (value) => {
    setSelectedPreferences(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const handleRestrictionChange = (value) => {
    setSelectedRestrictions(prev =>
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); 

    if (!showConfirmation) {

      const newEmptyFields = [];
      if (!age) newEmptyFields.push('age');
      if (!weight) newEmptyFields.push('weight');
      if (!height) newEmptyFields.push('height');
      if (!gender) newEmptyFields.push('gender');
      if (!activityLevel) newEmptyFields.push('activity_level'); 

      setEmptyFields(newEmptyFields);

      if (newEmptyFields.length > 0) {
        setError('Please fill in all required fields');
        return;
      }

      setFormData({
        age,
        weight,
        height,
        gender: gender === 'M' ? 'Male' : 'Female',
        activityLevel: getActivityLevelLabel(activityLevel),
        preferences: selectedPreferences.length > 0 ? selectedPreferences : ['None selected'],
        restrictions: selectedRestrictions.length > 0 ? selectedRestrictions : ['None selected']
      });
      setShowConfirmation(true);
    } else {
      try {
        setIsLoading(true); // Start loading
        setError(null);

        const patientData = {
          age,
          height,
          weight,
          gender,
          activity_level: activityLevel,
          preference: selectedPreferences.length > 0 ? selectedPreferences.join(', ') : "None",
          restrictions: selectedRestrictions.length > 0 ? selectedRestrictions.join(', ') : "None"
        };

        const endpoint = user ? `${PATIENT_API}` : `${PATIENT_API}/guest-predict`; 
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
        setIsFormVisible(false);
        setShowConfirmation(false);
      } catch (error) {
        setError('Failed to submit form');
        setShowConfirmation(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    </div>
  );

  const getActivityLevelLabel = (value) => {
    switch(value) {
      case '1.2': return 'Sedentary';
      case '1.4': return 'Lightly Active';
      case '1.5': return 'Moderately Active';
      case '1.7': return 'Very Active';
      case '1.9': return 'Extra Active';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
    {/* Form & Confirmation Form Section */}
    {isFormVisible && (
      <div className="max-w-[60rem] mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {showConfirmation ? "Confirm Details" : "Generate Meal Plan"}
        </h2>
        <p className="text-sm text-gray-500 mt-2 text-center ">
          Please fill out all fields to proceed.
        </p>
        {showConfirmation ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-gray-700">
              <div className="confirmation-item">
                <span className="font-medium">Age:</span> {formData?.age}
              </div>
              <div className="confirmation-item">
                <span className="font-medium">Weight:</span> {formData?.weight}{" "}
                kg
              </div>
              <div className="confirmation-item">
                <span className="font-medium">Height:</span> {formData?.height}{" "}
                cm
              </div>
              <div className="confirmation-item">
                <span className="font-medium">Gender:</span> {formData?.gender}
              </div>
              <div className="confirmation-item">
                <span className="font-medium">Activity Level:</span>{" "}
                {formData?.activityLevel}
              </div>
              <div className="confirmation-item">
                <span className="font-medium">Preferences:</span>{" "}
                {formData?.preferences.join(", ")}
              </div>
              <div className="confirmation-item">
                <span className="font-medium">Restrictions:</span>{" "}
                {formData?.restrictions.join(", ")}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
              >
                Edit Details
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-green-700'}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner/>
                    Generating...
                  </div>
                ) : (
                  'Confirm & Generate'
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid md:grid-cols-4 gap-6 pt-10">
              {/* Age Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  disabled={!!user}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-30 p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    emptyFields.includes("age")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  
                />
              </div>
              {/* Weight Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={`w-30 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    emptyFields.includes("weight")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  
                />
              </div>
              {/* Height Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={`w-30 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    emptyFields.includes("height")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  
                />
              </div>
              {/* Gender Input */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={!!user}
                  className={`w-50 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 text-sm ${
                    emptyFields.includes("gender")
                      ? "border-red-500"
                      : "border-gray-300"
                  } ${
                    gender === '' ? 'text-gray-400' : ''
                  }`}
                >
                  <option value="" className="hidden">Select Gender</option>
                  <option value="M" className="text-gray-800 normal">Male</option>
                  <option value="F" className="text-gray-800 normal">Female</option>
                </select>
              </div>
              {/* Activity Level Select */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level
                </label>
                <select 
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className={`w-50 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 text-sm ${
                    emptyFields.includes("activity_level")
                      ? "border-red-500"
                      : "border-gray-300"
                  } ${
                    activityLevel === '' ? 'text-gray-400' : ''
                  }`}   
                >
                  <option value="" className="hidden">Select activity level</option>
                  <option value="1.2" className="text-gray-800 normal">Sedentary</option>
                  <option value="1.4" className="text-gray-800 normal">Lightly Active</option>
                  <option value="1.5" className="text-gray-800 normal">Moderately Active</option>
                  <option value="1.7" className="text-gray-800 normal">Very Active</option>
                  <option value="1.9" className="text-gray-800 normal">Extra Active</option>
                </select>
              </div>
            </div>
            {/* Preferences */}
            <div>
              {/* Dietary Preferences Checkboxes */}
              <div className="form-group py-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Preferences
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Select your preferred dietary options.
                </p>
                <div className="grid grid-cols-4 gap-y-2 gap-x-4">
                  {DIETARY_PREFERENCES.map((preference) => (
                    <label
                      key={preference}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPreferences.includes(preference)}
                        onChange={() => handlePreferenceChange(preference)}
                        className="h-5 w-5 text-green-600 border-gray-300 rounded cursor-pointer focus:ring-green-500 transition-all"
                      />
                      <span className="text-sm text-gray-700">
                        {preference}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Dietary Restrictions Checkboxes */}
              <div className="form-group pt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Select any dietary restrictions you have.
                </p>
                <div className="grid grid-cols-4 gap-y-2 gap-x-4">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <label
                      key={restriction}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRestrictions.includes(restriction)}
                        onChange={() => handleRestrictionChange(restriction)}
                        className="h-5 w-5 text-green-600 border-gray-300 cursor-pointer rounded focus:ring-green-500 transition-all"
                      />
                      <span className="text-sm text-gray-700">
                        {restriction}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <div
                className="p-1 text-red-700 bg-red-100 rounded-lg text-center"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className= {`w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 font-medium ${
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Generating Meal Plan...' : 'Review & Generate'}
            </button>
          </form>
        )}
      </div>
    )}

    {/* Meal Plan Section */}
    {mealPlan && (
      <div className="max-w-[90rem] mx-auto mt-12 p-8 bg-white rounded-lg shadow-lg">
        <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Your Weekly Meal Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(mealPlan).map(([day, meals]) => (
            <div
              key={day}
              className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h4 className="text-2xl font-semibold text-green-600 mb-6 border-b border-gray-200 pb-2 text-center">
                {day}
              </h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-semibold text-green-600 mb-2">
                    Breakfast
                  </h5>
                  <p className="text-gray-700 bg-white p-4 rounded-md shadow-sm">
                    {meals.breakfast}
                  </p>
                </div>
                <div>
                  <h5 className="text-lg font-semibold text-green-600 mb-2">
                    Lunch
                  </h5>
                  <p className="text-gray-700 bg-white p-4 rounded-md shadow-sm">
                    {meals.lunch}
                  </p>
                </div>
                <div>
                  <h5 className="text-lg font-semibold text-green-600 mb-2">
                    Dinner
                  </h5>
                  <p className="text-gray-700 bg-white p-4 rounded-md shadow-sm">
                    {meals.dinner}
                  </p>
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