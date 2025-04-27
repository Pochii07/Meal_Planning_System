import React, { useEffect, useState, useRef  } from 'react';
import RecipeModal from './modals/recipeModal.jsx';
import { RECIPES_API } from '../config/api';

import CopyButton from './clipboard.jsx';
import useCopyToClipboard from '../hooks/use_clipboard';

const PatientTable = ({ patients, onRemove, onRegenerateMealPlan, openRemoveDialog, setOpenRemoveDialog }) => {
  const { copiedCode, copyToClipboard } = useCopyToClipboard();

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);

  const [expandedPatientId, setExpandedPatientId] = useState(null)
  const expandRef = useRef(null);

    // handle scrolling
  useEffect(() => {
    if (expandedPatientId && expandRef.current) {
      expandRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [expandedPatientId]);

  const calculateProgress = (progress, skippedMeals) => {
  if (!progress) return 0;

  let completed = 0;
  let total = 0;
    
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = ['breakfast', 'lunch', 'dinner'];
    
  days.forEach(day => {
    meals.forEach(meal => {
      // don't count skipped meals toward total
      if (skippedMeals?.[day]?.[meal]) {
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

  const handleRemovePatient = (patientId) => {
    if (onRemove) {
      onRemove(patientId);
      setOpenRemoveDialog(true)
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
    <div className="patient-table-container bg-white">
        <div className="patient-table-header">
            <table>
              <thead>
                <tr>
                  <th>Name (LN, FN) </th>
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
          {(!patients || patients.length === 0) ? (
            <div className='text-center text-gray-500 py-2'>
              No Patients found.
            </div>
          ) : (
            <table>
              {patients && patients.map((patient) => (
                <tbody key={patient._id}>
                  <tr className="hover:bg-gray-50 transition-colors inherit">
                    <td className="td-name whitespace-normal break-words max-w-[200px]">
                      <div className="text-sm font-medium text-gray-900 uppercase">
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
                              style={{ width: `${calculateProgress(patient.progress, patient.skippedMeals)}%` }}
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
                    <td className="px-6 whitespace-nowrap text-sm font-medium">
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
                      <td ref={expandRef} colSpan="6" className="px-5 py-0 bg-gray-50">
                        <div className="mt-4 p-4 bg-white rounded-lg shadow">
                          <h4 className="font-semibold text-gray-700 mb-2">
                            Patient Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Age: {patient.age} years old
                              </p>
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
                        <div className="grid grid-cols-7 gap-1 py-4">
                          <div className="col-span-7 mb-2 text-sm italic text-gray-600">
                            Click the recipe name for more information
                          </div>
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
                                  <div key={meal} className="flex items-start">
                                    <span
                                      className={`inline-block w-4 h-4 min-w-4 rounded-full mr-2 transition-colors ${
                                        patient.skippedMeals?.[day]?.[meal]
                                          ? 'bg-red-500' 
                                          : patient.progress?.[day]?.[meal] 
                                            ? 'bg-green-500' 
                                            : 'bg-gray-300'
                                      }`}
                                      aria-label={`${meal} status indicator`}
                                    ></span>
                                    <div className="flex flex-col flex-1 w-full">
                                      <div className="flex flex-col">
                                      <span className="font-semibold text-sm text-gray-700 capitalize">
                                          {meal}:
                                        </span>
                                        <span
                                          className={`text-sm ${
                                            patient.skippedMeals?.[day]?.[meal] 
                                              ? 'text-red-600 line-through' 
                                              : 'text-gray-800'
                                          } ${patient.prediction?.[day]?.[meal] 
                                            ? 'cursor-pointer hover:text-green-600' 
                                            : ''}`}
                                          onClick={() => {
                                            if (patient.prediction?.[day]?.[meal]) {
                                              fetchRecipeDetails(patient.prediction[day][meal]);
                                            }
                                          }}
                                        >
                                          {patient.prediction?.[day]?.[meal] || 'No meal planned'}
                                        </span>
                                      </div>                                      
                                      {patient.skippedMeals?.[day]?.[meal] && patient.mealNotes?.[day]?.[meal] && (
                                        <div className="mt-1 text-xs italic text-gray-600 bg-red-50 p-1.5 rounded border border-red-100">
                                          Note: {patient.mealNotes[day][meal]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}                    
                        </div>
                        <div className='flex justify-end mt-0'>
                          {calculateProgress(patient.progress, patient.skippedMeals) >= 0 && (
                            <button
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
                              onClick={() => onRegenerateMealPlan(patient._id)}
                            >
                              Regenerate Meal Plan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}  
            </table>
          )}
        </div>    
    <RecipeModal 
        recipe={selectedRecipe}
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
    />         
    </div>
  );
};

export default PatientTable;