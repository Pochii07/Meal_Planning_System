import { useState, useEffect } from "react";
import { usePatientContext } from "../hooks/use_patient_context";
import { useAuthStore } from "../store/authStore";
import { PATIENT_API, RECIPES_API } from '../config/api';

import RecipeCard from "./RecipeCard.jsx";

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
  "Fish Allergy",
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

  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

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

  const calculateBMR = (weight, height, age, gender) => {
    if (gender === 'M') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateTDEE = (bmr, activityLevel) => {
    return bmr * parseFloat(activityLevel);
  };

  const calculateBMI = (weight, height) => {
    return (weight / ((height / 100) ** 2)).toFixed(2);
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

      const bmr = calculateBMR(parseFloat(weight), parseFloat(height), parseFloat(age), gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const bmi = calculateBMI(parseFloat(weight), parseFloat(height));

      setFormData({
        age,
        weight,
        height,
        gender: gender === 'M' ? 'Male' : 'Female',
        activityLevel: getActivityLevelLabel(activityLevel),
        preferences: selectedPreferences.length > 0 ? selectedPreferences : ['None selected'],
        restrictions: selectedRestrictions.length > 0 ? selectedRestrictions : ['None selected'],
        BMR: Math.round(bmr),
        TDEE: Math.round(tdee),
        BMI: bmi
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

  return (
    <div className="container mx-auto px-4 py-8">
    {/* Form & Confirmation Form Section */}
    {isFormVisible && (
      <div className="max-w-[60rem] mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {showConfirmation ? "Confirm Details" : "Generate Meal Plan"}
        </h2>
        <p className="text-sm text-gray-500 mt-5 text-center ">
          Please fill out all fields to proceed.
        </p>
        {showConfirmation ? (
          <div className="space-y-6 mt-12">
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

            { (!user || user.role !== 'user') && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 rounded">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-700">
                    <span className="font-bold">WARNING</span> <br/>
                    The meal plan generated using this form will not be saved. To begin your meal tracking journey with us, please consider registering an account.
                  </p>
                </div>
              </div>
            )}

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
        
        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">TDEE (Total Daily Energy Expenditure)</h4>
                <p className="text-gray-600">{mealPlan.TDEE || formData?.TDEE || Math.round(calculateTDEE(calculateBMR(parseFloat(weight), parseFloat(height), parseFloat(age), gender), activityLevel))} calories per day</p>
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
                <p className="text-gray-600">{mealPlan.BMI || formData?.BMI || calculateBMI(parseFloat(weight), parseFloat(height))}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            <p>This meal plan is designed based on your calculated energy needs and body composition.</p>
          </div>
        </div>

        <div className="col-span-7 mb-2 text-sm italic text-gray-600 text-center mb-5">
          Click the recipe name for more information
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(mealPlan).map(([day, dayData]) => (
            <div
              key={day}
              className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h4 className="text-2xl font-semibold text-green-600 mb-6 border-b border-gray-200 pb-2 text-center">
                {day}
                {dayData.date && (
                  <div className="text-sm text-gray-500 font-normal">
                    {new Date(dayData.date).toLocaleDateString()}
                  </div>
                )}
              </h4>
              <div className="space-y-6">
                {['breakfast', 'lunch', 'dinner'].map(meal => (
                  <div key={meal} className="bg-white p-4 rounded-md shadow-sm">
                    <h5 className="text-lg font-semibold text-green-600 mb-2 capitalize">
                      {meal}
                    </h5>
                    <div className="text-gray-700">
                      <p 
                        className="font-medium hover:text-green-600 cursor-pointer"
                        onClick={() => fetchRecipeDetails(dayData[meal])}
                      >
                        {dayData[meal] || 'No meal planned'}
                      </p>
                      
                      {dayData[`${meal}_details`] && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Base Calories</span>
                              <span className="font-medium">{dayData[`${meal}_details`].calories} kcal</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Servings</span>
                              <span className="font-medium">{dayData[`${meal}_details`].servings}</span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <span className="block text-xs text-gray-500">Total Calories</span>
                              <span className="font-medium">{dayData[`${meal}_details`].total_calories} kcal</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
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

export default PatientForm;