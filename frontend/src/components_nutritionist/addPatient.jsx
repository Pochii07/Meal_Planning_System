import React, { useState } from 'react';
import { DIETARY_PREFERENCES, DIETARY_RESTRICTIONS } from './dietary.js';

const AddPatientForm = ({ onSubmit, error }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);

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
  
    try {
      // Create patient data object
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

      console.log("Submitting patient data:", patientData);

      // Use the utility function to get headers
      const response = await fetch(`${NUTRITIONIST_API}`, {
        method: 'POST',
        body: JSON.stringify(patientData),
        headers: getAuthHeaders()
      });
      
      const json = await response.json();
      console.log("API response:", json);

      if (!response.ok) {
        setError(json.error || "Failed to create patient")
      } else {
        // Reset form fields
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
        dispatch({ type: 'CREATE_PATIENT', payload: json });
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Patient</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Age Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              {/* Weight Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Height Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Gender Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
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
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
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

              {/* Dietary Preference Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
                <p className="text-sm text-gray-500 mt-2">
                  Select preferred dietary options.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
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

              {/* Restrictions Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                <p className="text-sm text-gray-500 mt-2">
                  Select any dietary restrictions.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
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
              <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
            )}
            
            <button 
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-300"
            >
              Generate Meal Plan
            </button>
        </form>
    </div>
  );
};

export default AddPatientForm;

