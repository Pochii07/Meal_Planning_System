import React, { useEffect, useState, useRef, useCallback } from 'react';
import RecipeCard from '../components/RecipeCard.jsx';
import MealPlanHistoryModal from './modals/mealPlanHistoryModal.jsx';
import { RECIPES_API } from '../config/api';
import CopyButton from './clipboard.jsx';
import useCopyToClipboard from '../hooks/use_clipboard';
import useForceUpdate from '../hooks/use_force_update';
import { patientService } from '../services/patientService';

const PatientTable = ({ patients: propsPatients, 
  onRemove, 
  onRegenerateMealPlan, 
  setOpenRemoveDialog, 
  setOpenRegenerateDialog,
  setRegeneratePatientId, 
  regeneratePatientId  }) => {
  // Existing state
  const { copiedCode, copyToClipboard } = useCopyToClipboard();
  const forceUpdate = useForceUpdate();
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const expandRef = useRef(null);
  const [mealPlanVersion, setMealPlanVersion] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [patients, setPatients] = useState(propsPatients || []);
  const [editingAddon, setEditingAddon] = useState(null);
  const [addonText, setAddonText] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["breakfast", "lunch", "dinner"];

  // Update local state when props change
  useEffect(() => {
    setPatients(propsPatients || []);
  }, [propsPatients]);

  const handleViewHistory = async (patientId) => {
    try {
        setSelectedPatientId(patientId);
        const history = await patientService.getMealPlanHistory(patientId);
        setSelectedPatientHistory(history);
        setHistoryModalOpen(true);
    } catch (error) {
        console.error('Error fetching meal plan history:', error);
    }
  };

  const calculateProgress = (progress, skippedMeals) => {
    if (!progress) return { percent: 0, completed: 0, total: 0 };
  
    let completed = 0;
    let total = 0;
  
    days.forEach((day) => {
      meals.forEach((meal) => {
        if (!skippedMeals?.[day]?.[meal]) {
          if (progress[day]?.[meal]) {
            completed++;
          }
          total++;
        }
      });
    });
  
    return {
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total: total || 21,
    };
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

  const handleNoteSubmit = async (patientId, day, meal, note) => {
    try {
      const response = await patientService.updateNutritionistNotes(patientId, day, meal, note);
  
      if (response.success) {
        // Update the local patients array
        const updatedPatients = patients.map((p) =>
          p._id === patientId ? { ...p, nutritionistNotes: response.nutritionistNotes } : p
        );
  
        // Update the patients state
        setPatients(updatedPatients);
  
        // Reset editing state
        setEditingNote(null);
        setNoteText("");
  
        // Show a temporary success toast/message
        const successToast = document.createElement("div");
        successToast.className =
          "fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up";
        successToast.innerHTML = '<span class="mr-2">✅</span> Note updated successfully!';
        document.body.appendChild(successToast);
  
        setTimeout(() => {
          successToast.remove();
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating nutritionist note:", error);
    }
  };

  const handleAddAddon = async (patientId, day, meal) => {
    try {
      if (!addonText.trim()) return;
      
      const response = await patientService.addMealAddon(patientId, day, meal, addonText);
      
      if (response.success) {
        // Update the local patients array
        const updatedPatients = patients.map(p => 
          p._id === patientId 
            ? { ...p, mealAddons: response.mealAddons } 
            : p
        );
        setPatients(updatedPatients);
        setEditingAddon(null);
        setAddonText('');
      }
    } catch (error) {
      console.error("Error adding meal addon:", error);
    }
  };

  const handleRemoveAddon = async (patientId, day, meal, addonIndex) => {
    try {
      // Add logging to see what's being sent
      console.log('Removing addon with:', { patientId, day, meal, addonIndex });
      // console.log('Current addons:', patient.mealAddons?.[day]?.[meal]);
      
      // Call your API to remove the addon
      const response = await patientService.removeMealAddon(patientId, day, meal, addonIndex);
      
      if (response.success) {
        // Update the local patients array
        const updatedPatients = patients.map(p => 
          p._id === patientId 
            ? { ...p, mealAddons: response.mealAddons } 
            : p
        );
        
        setPatients(updatedPatients);
      } else {
        // Add error handling
        console.error("Error from server:", response.error);
      }
    } catch (error) {
      console.error("Error removing meal addon:", error);
    }
  };
  // Update the function to accept a patientId parameter
  const handleConfirmRegenerate = useCallback((patientId = regeneratePatientId) => {
    console.log("Regenerating meal plan for patient:", patientId);
    
    onRegenerateMealPlan(patientId).then((updatedData) => {
      console.log("Meal plan regenerated successfully:", updatedData);
      
      setMealPlanVersion(prev => prev + 1);
      forceUpdate(); 
      
      setTimeout(() => {
        forceUpdate();
        console.log("Forced update after timeout");
      }, 500);
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up';
      successToast.innerHTML = '<span class="mr-2">✅</span> Meal plan regenerated successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    });
    
    // Close dialog
    setOpenRegenerateDialog(false);
    setRegeneratePatientId(null);
  }, [regeneratePatientId, onRegenerateMealPlan, forceUpdate]);

  useEffect(() => {
    if (expandedPatientId && expandRef.current) {
      expandRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [expandedPatientId]);

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
                      <div className="flex flex-col">
                        {patient.progress ? (
                          (() => {
                            const progress = calculateProgress(patient.progress, patient.skippedMeals);
                            return (
                              <>
                                <div className="w-full bg-gray-200 rounded-full h-2.5"> 
                                  <div
                                    className="bg-green-600 h-2.5 rounded-full"
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 ml-2">
                                  {progress.percent}% ({progress.completed}/{progress.total})
                                </span>
                              </>
                            );
                          })()
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
                            Patient Details of <span className="text-green-600">{`${patient.firstName.toUpperCase()} ${patient.lastName.toUpperCase()}`}</span>
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
                              <div className="border-b border-gray-200 my-2"></div>
                              <p className="text-sm text-gray-600">
                                BMI: {patient.BMI}
                              </p>
                              <p className="text-sm text-gray-600">
                                TDEE: {patient.TDEE - 600} calories
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
                        {calculateProgress(patient.progress, patient.skippedMeals) >= 0}
                        
                        <div className="grid grid-cols-7 gap-1 py-4">
                          <div ref={expandRef} className="col-span-7 mb-2 text-sm italic text-gray-600">
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
                                {patient.prediction?.[day]?.date && (
                                  <div className="mt-1">
                                    <span className="text-xs text-gray-500">
                                      {new Date(patient.prediction[day].date).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </h4>
                              <div className="space-y-2">
                                {meals.map((meal) => {
                                  return (
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
                                        <div className="flex flex-col">
                                        <span 
                                          className="font-medium cursor-pointer hover:text-green-600 hover:underline"
                                          onClick={() => fetchRecipeDetails(patient.prediction?.[day]?.[meal])}
                                        >
                                          {patient.prediction?.[day]?.[meal]}
                                        </span>
                                          {patient.prediction?.[day]?.[`${meal}_details`]?.calories > 0 && (
                                            <div className="text-xs text-gray-500">
                                              <div>Base Calories: {patient.prediction[day][`${meal}_details`].calories} kcal</div>
                                              <div>Prescribed Serving: {patient.prediction[day][`${meal}_details`].servings}</div>
                                              <div>Total Calories: {patient.prediction[day][`${meal}_details`].total_calories} kcal</div>
                                            </div>
                                          )}
                                        </div>
                                      </div>                                    
                                      {patient.skippedMeals?.[day]?.[meal] && patient.mealNotes?.[day]?.[meal] && (
                                        <div className="mt-1 text-xs italic text-gray-600 bg-red-50 p-1.5 rounded border border-red-100">
                                          Note: {patient.mealNotes[day][meal]}
                                        </div>
                                      )}
                                      {patient.prediction?.[day]?.[meal] && (
                                        <div className="mt-1">
                                          {editingNote === `${patient._id}-${day}-${meal}` ? (
                                            <div className="flex flex-col space-y-2">
                                              <textarea
                                                className="w-full p-2 text-sm border border-gray-300 rounded"
                                                value={noteText}
                                                onChange={(e) => setNoteText(e.target.value)}
                                                placeholder="Add note..."
                                                rows={2}
                                              />
                                              <div className="flex justify-end space-x-2">
                                                <button 
                                                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                                  onClick={() => {
                                                    setEditingNote(null);
                                                    setNoteText("");
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                                <button 
                                                  className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                                                  onClick={() => handleNoteSubmit(patient._id, day, meal, noteText)}
                                                >
                                                  Save
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              {patient.nutritionistNotes?.[day]?.[meal] && (
                                                <div className="p-1.5 mt-1 text-xs italic bg-green-50 border border-green-100 rounded">
                                                  <span className="font-medium">Your note:</span> {patient.nutritionistNotes[day][meal]}
                                                </div>
                                              )}
                                              <button 
                                                className="text-xs text-blue-600 hover:underline mt-1"
                                                onClick={() => {
                                                  setEditingNote(`${patient._id}-${day}-${meal}`);
                                                  setNoteText(patient.nutritionistNotes?.[day]?.[meal] || "");
                                                }}
                                              >
                                                {patient.nutritionistNotes?.[day]?.[meal] ? "Edit note" : "Add note"}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {/* Meal addons section */}
                                      <div className="mt-2">
                                        {patient.prediction?.[day]?.[meal] && (
                                          <div>
                                            {/* Display existing addons */}
                                            {patient.mealAddons?.[day]?.[meal]?.map((addon, idx) => (
                                              <div key={idx} className="flex items-center gap-1 text-xs my-1 bg-blue-50 p-1.5 rounded">
                                                {addon.skipped}
                                                {addon.completed && !addon.skipped && (
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                  </svg>
                                                )}
                                                <span className={`flex-grow truncate ${addon.skipped ? 'line-through text-red-600' : addon.completed ? 'text-green-600' : ''}`}>
                                                  {addon.text}
                                                </span>
                                                <button className="text-red-600 hover:text-red-800 ml-1 flex-shrink-0"
                                                  onClick={() => handleRemoveAddon(patient._id, day, meal, idx)}>
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414-1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ))}                                            
                                            {/* Add new addon */}
                                            {editingAddon === `${patient._id}-${day}-${meal}` ? (
                                              <div className="flex flex-col mt-2 gap-2">
                                                <textarea
                                                  className="w-full text-xs p-1.5 border rounded"
                                                  value={addonText}
                                                  onChange={(e) => setAddonText(e.target.value)}
                                                  placeholder="Enter addon instructions..."
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <button 
                                                    className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                                                    onClick={() => setEditingAddon(null)}
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button 
                                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                    onClick={() => handleAddAddon(patient._id, day, meal)}
                                                  >
                                                    Add
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <button 
                                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                                                onClick={() => {
                                                  setEditingAddon(`${patient._id}-${day}-${meal}`);
                                                  setAddonText('');
                                                }}
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add meal addon
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>  
                            </div>
                          ))}                    
                        </div>
                        <div className='flex justify-end mt-0 gap-2'>
                          <button
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                              onClick={() => handleViewHistory(patient._id)}
                          >
                              View History
                          </button>
                          {patient.progress && (
                            <button
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
                              onClick={() => handleConfirmRegenerate(patient._id)}
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
        {recipeModalOpen && selectedRecipe && (
          <RecipeCard 
            name={selectedRecipe.title}
            description={selectedRecipe.summary}
            image={selectedRecipe.image}
            recipe={selectedRecipe}
            initialOpen={recipeModalOpen}
          />
        )}       
        <MealPlanHistoryModal
            isOpen={historyModalOpen}
            onClose={() => setHistoryModalOpen(false)}
            history={selectedPatientHistory}
            patient={patients?.find(p => p._id === selectedPatientId)}
        />
    </div>
  );
};

export default PatientTable;