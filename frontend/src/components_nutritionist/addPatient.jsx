import React, { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { DIETARY_PREFERENCES, DIETARY_RESTRICTIONS } from './dietary.js';

const AddPatientForm = ({ onSubmit, dispatch, setIsFormOpen }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [error, setError] = useState(null);
  
  // Add state for confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    let timer;
    if (showSuccessMessage) {
      timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessMessage]);

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

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    if (!showConfirmation) {
      // Validate form fields
      if (!firstName || !lastName || !age || !height || !weight || !gender || !activityLevel) {
        setError("Please fill in all required fields");
        return;
      }

      // Set form data for confirmation
      setFormData({
        firstName,
        lastName,
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
      // Submit the form
      try {
        setIsLoading(true);
        const patientData = {
          firstName,
          lastName,
          age,
          height,
          weight,
          gender,
          activity_level: activityLevel,
          preference: selectedPreferences.length > 0 ? selectedPreferences.join(', ') : "None",
          restrictions: selectedRestrictions.length > 0 ? selectedRestrictions.join(', ') : "None",
        }
        const response = await patientService.createPatient(patientData);
        console.log("API response:", response);
        
        if (response.error) {
          setError(response.error || "Failed to create patient");
          setShowConfirmation(false);
          return;
        } else {

          if (dispatch) {
            dispatch({ type: 'CREATE_PATIENT', payload: response });
          }
          setFirstName('');
          setLastName('');
          setAge('');
          setHeight('');
          setWeight('');
          setGender('');
          setActivityLevel('');
          setSelectedPreferences([]);
          setSelectedRestrictions([]);
          setError(null);
          setTimeout(() => {
            if (setIsFormOpen) {
              setIsFormOpen(false);
            }
          }, 5000);
          setShowSuccessMessage(true);
        }
      } catch (error) {
        console.error("Error creating patient:", error);
        setError("An unexpected error occurred. Please try again.");
        setShowConfirmation(false);
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {showConfirmation ? "Confirm Patient Details" : "Add New Patient"}
      </h2>
      
      {showConfirmation ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-gray-700">
            <div className="confirmation-item">
              <span className="font-medium">First Name:</span> {formData?.firstName}
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Last Name:</span> {formData?.lastName}
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Age:</span> {formData?.age}
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Weight:</span> {formData?.weight} kg
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Height:</span> {formData?.height} cm
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Gender:</span> {formData?.gender}
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Activity Level:</span> {formData?.activityLevel}
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Preferences:</span> {formData?.preferences.join(", ")}
            </div>
            <div className="confirmation-item">
              <span className="font-medium">Restrictions:</span> {formData?.restrictions.join(", ")}
            </div>
          </div>

          {error && (
            <div className="p-2 text-red-700 bg-red-100 rounded-lg">{error}</div>
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
              disabled={isLoading || showSuccessMessage}
              className={`flex-1 bg-green-600 text-white py-2 px-4 rounded-lg transition duration-300 ${(isLoading || showSuccessMessage) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-green-700'}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner/>
                  Generating...
                </div>
              ) : (
                'Confirm & Generate Meal Plan'
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="md:col-span-2 grid md:grid-cols-4 gap-4">
            {/* Name Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-64 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-64 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
              
            {/* Compact Numerical Inputs */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-3/5 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-3/5 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-3/5 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            {/* Gender Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-64 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            {/* Activity Level Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-64 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
            {/* Dietary Sections */}  
            <div className="md:col-span-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dietary Preferences and Restrictions */}           
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
                  <p className="text-sm text-gray-500 mt-2">
                    Select preferred dietary options.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2">
                    {DIETARY_PREFERENCES.map((preference) => (
                      <label
                        key={preference}
                        className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPreferences.includes(preference)}
                          onChange={() => handlePreferenceChange(preference)}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded cursor-pointer focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">
                          {preference}
                        </span>
                      </label>
                    ))}
                  </div>
                </div> 
            {/* Restrictions Checkboxes */}        
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
                  <p className="text-sm text-gray-500 mt-2">
                    Select any dietary restrictions.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            </div>
          </div>
          
          {error && (
            <div className="p-2 text-red-700 bg-red-100 rounded-lg">{error}</div>
          )} 
          <div className="flex justify-end">
            <button 
              type="submit"
              className="w-64 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300 text-sm font-medium"
            >
              Review & Generate Meal Plan
            </button>
          </div> 
        </form>
      )}
      {/* Success Message */}
      {showSuccessMessage && (
        <div 
          className="fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up"
          style={{
            animation: 'fadeIn 0.3s ease-in-out',
            zIndex: 9999
          }}
        >
          <span className="mr-2">✅</span>
          Patient created successfully!
        </div>
      )}
    </div>
  );
};
export default AddPatientForm;

