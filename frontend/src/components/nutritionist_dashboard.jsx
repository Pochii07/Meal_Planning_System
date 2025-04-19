import { useState, useEffect } from 'react'
import { useNutritionistPatientContext } from '../hooks/use_nutritionist_patient_context'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom';
import React from 'react'; // Make sure React is imported

const NutritionistDashboard = () => {
  const { patients, dispatch } = useNutritionistPatientContext()
  const { user, isAuthenticated, isCheckingAuth} = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [expandedPatientId, setExpandedPatientId] = useState(null)
  
  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [preference, setPreference] = useState('')
  const [restrictions, setRestrictions] = useState('')

  // Add this function near the top of your component
  const calculateProgress = (progress, skippedMeals) => {
    if (!progress) return 0;
    
    let completed = 0;
    let total = 0;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['breakfast', 'lunch', 'dinner'];
    
    days.forEach(day => {
      meals.forEach(meal => {
        // Don't count skipped meals toward total
        if (skippedMeals?.[day]?.[meal]) {
          // Skip this meal in calculations
        } else {
          if (progress[day]?.[meal]) {
            completed++;
          }
          total++;
        }
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Fetch patients on component mount
  useEffect(() => {

    if (!isCheckingAuth && (!isAuthenticated || !user || user.role !== 'nutritionist')) {
      navigate('/'); // Redirect non-nutritionist users
    } else {
      setLoading(false);
    }

    const fetchPatients = async () => {
      const response = await fetch('/api/nutritionist/patients', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      const json = await response.json()

      if (response.ok) {
        dispatch({ type: 'SET_PATIENTS', payload: json })
      }
    }

    if (user) {
      fetchPatients()
    }
  }, [dispatch, user, isAuthenticated, isCheckingAuth, navigate])

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    const patientData = {
      firstName,
      lastName,
      age,
      height,
      weight,
      gender,
      activity_level: activityLevel,
      preference: preference || "None",
      restrictions: restrictions || "None",
    }

    const response = await fetch('/api/nutritionist/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error)
    } else {
      // Reset form
      setFirstName('')
      setLastName('')
      setAge('')
      setHeight('')
      setWeight('')
      setGender('')
      setActivityLevel('')
      setPreference('')
      setRestrictions('')
      setError(null)
      dispatch({ type: 'CREATE_PATIENT', payload: json })
      setIsFormOpen(false)
    }
  }

  const handleProgressToggle = async (patientId, day, meal) => {
    try {
        const response = await fetch(`/api/nutritionist/patients/${patientId}/progress`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                day,
                meal,
                value: !patient.progress?.[day]?.[meal]
            })
        });

        if (response.ok) {
            const updatedPatient = await response.json();
            // Update the patients list with the new progress
            dispatch({ 
                type: 'UPDATE_PATIENT_PROGRESS', 
                payload: { id: patientId, progress: updatedPatient.progress }
            });
        }
    } catch (error) {
        console.error('Error updating progress:', error);
    }
};

const handleDeletePatient = async (patientId) => {
  // Optimistically update the UI by filtering out the deleted patient
  dispatch({ 
    type: 'SET_PATIENTS', 
    payload: patients.filter(patient => patient._id !== patientId) 
  });

  try {
    const response = await fetch(`/api/nutritionist/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error || 'Failed to delete patient');
      // Revert the optimistic update if the API call fails
      dispatch({ type: 'SET_PATIENTS', payload: patients });
    }
  } catch (error) {
    console.error('Error deleting patient:', error);
    setError('Failed to delete patient');
    // Revert the optimistic update if an error occurs
    dispatch({ type: 'SET_PATIENTS', payload: patients });
  }
};

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Add Patient Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Patient Management</h1>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
        >
          {isFormOpen ? 'Close Form' : 'Add New Patient'}
        </button>
      </div>

      {/* Patient Form */}
      {isFormOpen && (
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

              {/* Dietary Preference Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preference</label>
                <select
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">None</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Low-Purine">Low-Purine</option>
                  <option value="Low-Fat/Heart-Healthy">Low-Fat/Heart-Healthy</option>
                  <option value="Low-Sodium">Low-Sodium</option>
                </select>
              </div>

              {/* Restrictions Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restrictions</label>
                <select
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="None">None</option>
                  <option value="Lactose Free">Lactose Free</option>
                  <option value="Peanut Allergy">Peanut Allergy</option>
                  <option value="Shellfish Allergy">Shellfish Allergy</option>
                  <option value="Halal">Halal</option>
                </select>
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
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients && patients.map((patient) => (
              <React.Fragment key={patient._id}>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.age}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.BMI}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.progress ? (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${calculateProgress(patient.progress, patient.skippedMeals)}%` }}
                          ></div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No progress yet</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded-md text-center">
                      {patient.accessCode || 'No code'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-green-600 hover:text-green-900 mr-4"
                      onClick={() => setExpandedPatientId(
                        expandedPatientId === patient._id ? null : patient._id
                      )}
                    >
                      {expandedPatientId === patient._id ? 'Hide Progress' : 'View Progress'}
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeletePatient(patient._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedPatientId === patient._id && (
                  <tr key={`expanded-${patient._id}`}>
                    <td colSpan="7" className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-7 gap-4">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <div key={day} className="bg-white p-4 rounded-lg shadow">
                            <h4 className="font-semibold text-gray-700 mb-2">{day}</h4>
                            <div className="space-y-2">
                              {['breakfast', 'lunch', 'dinner'].map(meal => (
                                <div key={meal} className="space-y-1">
                                  <div className="flex items-center">
                                    <button
                                      className={`w-4 h-4 rounded-full mr-2 transition-colors ${
                                        patient.skippedMeals?.[day]?.[meal]
                                          ? 'bg-red-500' 
                                          : patient.progress?.[day]?.[meal] 
                                            ? 'bg-green-500' 
                                            : 'bg-gray-300'
                                      }`}
                                    />
                                    <span className={`text-sm capitalize ${
                                      patient.skippedMeals?.[day]?.[meal] ? 'text-red-600 line-through' : ''
                                    }`}>
                                      {meal}: {patient.prediction?.[day]?.[meal] || 'No meal planned'}
                                    </span>
                                  </div>
                                  
                                  {patient.skippedMeals?.[day]?.[meal] && patient.mealNotes?.[day]?.[meal] && (
                                    <div className="ml-6 text-xs italic text-gray-600 bg-red-50 p-1.5 rounded border border-red-100">
                                      Note: {patient.mealNotes[day][meal]}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-white rounded-lg shadow">
                        <h4 className="font-semibold text-gray-700 mb-2">Patient Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Height: {patient.height} cm</p>
                            <p className="text-sm text-gray-600">Weight: {patient.weight} kg</p>
                            <p className="text-sm text-gray-600">BMI: {patient.BMI}</p>
                            <p className="text-sm text-gray-600 font-semibold">Access Code: 
                              <span className="bg-green-100 text-green-800 ml-2 p-1 rounded font-mono">
                                {patient.accessCode || 'None'}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Activity Level: {patient.activity_level}</p>
                            <p className="text-sm text-gray-600">Dietary Preference: {patient.preference}</p>
                            <p className="text-sm text-gray-600">Restrictions: {patient.restrictions}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default NutritionistDashboard