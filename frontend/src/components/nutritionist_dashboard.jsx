import { useState, useEffect } from 'react'
import { useNutritionistPatientContext } from '../hooks/use_nutritionist_patient_context'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom';

import CopyButton from './clipboard';
import PatientSearchBar from './nutritionist_searchbar';

import useCopyToClipboard from '../hooks/use_clipboard';

import { BMI_CATEGORIES } from './nutritionist_searchbar';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const NutritionistDashboard = () => {
  const { patients = [], dispatch } = useNutritionistPatientContext()
  const { user, isAuthenticated, isCheckingAuth} = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filteredPatients, setFilteredPatients] = useState([]);
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

  const [searchQuery, setSearchQuery] = useState('');

  const { copiedCode, copyToClipboard } = useCopyToClipboard();

  const [removingPatientId, setRemovingPatientId] = useState(null);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);

  const calculateProgress = (progress) => {
    if (!progress) return 0;
    
    let completed = 0;
    let total = 0;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['breakfast', 'lunch', 'dinner'];
    
    days.forEach(day => {
      meals.forEach(meal => {
        if (progress[day]?.[meal]) {
          completed++;
        }
        total++;
      });
    });
    
    return Math.round((completed / total) * 100);
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
        setFilteredPatients(json);
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
/**
 * Toggles the progress of a patient's meal.
 * 
 * @param {string} patientId - The ID of the patient.
 * @param {string} day - The day of the meal.
 * @param {string} meal - The type of meal.
 */
  const handleProgressToggle = async (patientId, day, meal) => {
    try {
        // Fetch API to update patient progress
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

        // Check if the response is OK
        if (response.ok) {
            // Get the updated patient data
            const updatedPatient = await response.json();

            // Dispatch an action to update the patient's progress in the state
            dispatch({
                type: 'UPDATE_PATIENT_PROGRESS',
                payload: {
                    id: patientId,
                    progress: updatedPatient.progress
                }
            });
        }
    } catch (error) {
        // Log any errors that occur during the update process
        console.error('Error updating progress:', error);
    }
  };

  const handleRemovePatient = async (patientId) => {
    dispatch({ 
      type: 'SET_PATIENTS', 
      payload: patients.filter(patient => patient._id !== patientId) 
    });
  
    try {
      const response = await fetch(`/api/nutritionist/patients/${patientId}`, {
        method: 'DELETE', // Note: This should remain DELETE unless your API endpoint changes
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove patient');
        dispatch({ type: 'SET_PATIENTS', payload: patients });
      }
    } catch (error) {
      console.error('Error removing patient:', error);
      setError('Failed to remove patient');
      dispatch({ type: 'SET_PATIENTS', payload: patients });
    }
  };

  const handleSearch = (searchText, filterType) => {
    if (!searchText) {
      setFilteredPatients(patients);
      return;
    }
  
    const filtered = patients.filter(patient => {
      switch (filterType) {
        case 'name':
          return `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchText.toLowerCase());
        case 'age':
          return patient.age.toString() === searchText;
        case 'bmi':
          const category = BMI_CATEGORIES.find(c => c.label === searchText);
          if (!category) return false;
          return patient.BMI >= category.range[0] && patient.BMI <= category.range[1];
        default:
          return true;
      }
    });
  
    console.log('Filtered Patients:', filtered); // Debugging
    setFilteredPatients(filtered);
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
      <PatientSearchBar 
        onSearchChange={handleSearch}
      />
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
      <div className="patient-table-container bg-white">
        <div className="patient-table-header">
            <table>
              <thead>
                <tr>
                  <th className="th-name">Name</th>
                  <th>Age</th>
                  <th>BMI</th>
                  <th>Progress</th>
                  <th>Access Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
            </table>
        </div>   
        <div className="patient-table-body">
          {(filteredPatients && filteredPatients.length) === 0 ? (
            <div className='text-center text-gray-500 py-4'>
              No Patients found.
            </div>
          ) : (
            <table>
              {filteredPatients && filteredPatients.map((patient) => (
                <tbody key={patient._id}>
                  <tr className="hover:bg-gray-50 transition-colors inherit">
                    <td className="td-name whitespace-normal break-words max-w-[200px]">
                      <div className="text-sm font-medium text-gray-900">
                        {`${patient.lastName}, ${patient.firstName}`}
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
                              style={{
                                width: `${calculateProgress(patient.progress)}%`,
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500">No progress yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className='flex items-center gap-2'>
                        <div className="text-sm font-mono bg-gray-100 p-1 rounded-md text-center">
                          {patient.accessCode || "No code"}
                        </div>
                        {patient.accessCode && (
                          <CopyButton 
                            code={patient.accessCode} 
                            copiedCode={copiedCode} 
                            onCopy={copyToClipboard} 
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-green-600 hover:text-green-900 mr-4 cursor-pointer" title="View patient's meal progress"
                        onClick={() =>
                          setExpandedPatientId(
                            expandedPatientId === patient._id ? null : patient._id
                          )
                        }
                      >
                        {expandedPatientId === patient._id
                          ? "Hide Progress"
                          : "View Progress"}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                        onClick={() => {
                          handleRemovePatient(patient._id);
                          setOpenRemoveDialog(true);
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  {expandedPatientId === patient._id && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        <div className="mt-4 p-4 bg-white rounded-lg shadow">
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Patient Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Height: {patient.height} cm
                              </p>
                              <p className="text-sm text-gray-600">
                                Weight: {patient.weight} kg
                              </p>
                              <p className="text-sm text-gray-600">
                                BMI: {patient.BMI}
                              </p>
                              <p className="text-sm text-gray-600 font-semibold">
                                Access Code:
                                <div className="inline-flex gap-2">
                                <span className="bg-green-100 text-green-800 ml-2 p-1 rounded font-mono">
                                  {patient.accessCode || "None"}
                                </span>
                                {patient.accessCode && (
                                  <CopyButton 
                                    code={patient.accessCode} 
                                    copiedCode={copiedCode} 
                                    onCopy={copyToClipboard} 
                                  />
                                )}
                                </div>
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Activity Level: {patient.activity_level}
                              </p>
                              <p className="text-sm text-gray-600">
                                Dietary Preference: {patient.preference}
                              </p>
                              <p className="text-sm text-gray-600">
                                Restrictions: {patient.restrictions}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-4 py-8">
                          {[
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ].map((day) => (
                            <div key={day} className="bg-white p-4 rounded-lg shadow">
                              <h4 className="font-semibold text-gray-700 mb-2">
                                {day}
                              </h4>
                              <div className="space-y-2">
                                {["breakfast", "lunch", "dinner"].map((meal) => (
                                  <div key={meal} className="flex items-center">
                                    <button
                                      onClick={() =>
                                        handleProgressToggle(patient._id, day, meal)
                                      }
                                      className={`w-4 h-4 rounded-full mr-2 transition-colors ${
                                        patient.progress?.[day]?.[meal]
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    <span className="text-sm capitalize">
                                      {meal}:{" "}
                                      {patient.prediction[day]?.[meal] ||
                                        "No meal planned"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}  
            </table>
          )}
        </div>            
      </div>
      <Dialog
        open={openRemoveDialog}
        onClose={() => setOpenRemoveDialog(false)}
        aria-labelledby="remove-patient-dialog-title"
      >
        <DialogTitle id="remove-patient-dialog-title">
          Confirm Patient Removal
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this patient? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenRemoveDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              handleRemovePatient(removingPatientId);
              setOpenRemoveDialog(false);
            }}
            color="error"
            autoFocus
          >
            Remove Patient
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default NutritionistDashboard