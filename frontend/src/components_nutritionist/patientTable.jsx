import React, { useEffect, useState, useRef, useCallback } from 'react';
import RecipeModal from './modals/recipeModal.jsx';
import MealPlanHistoryModal from './modals/mealPlanHistoryModal.jsx';
import { RECIPES_API } from '../config/api';
import CopyButton from './clipboard.jsx';
import useCopyToClipboard from '../hooks/use_clipboard';
import useForceUpdate from '../hooks/use_force_update';
import { patientService } from '../services/patientService';

export const BMI_CATEGORIES = [ 
  { label: 'Underweight', range: [0, 18.4] }, 
  { label: 'Normal', range: [18.5, 22.9] }, 
  { label: 'Overweight', range: [23, 24.99] }, 
  { label: 'Obese I', range: [25, 29.9] }, 
  { label: 'Obese II', range: [30, Infinity] } 
];

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
  
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const meals = ["breakfast", "lunch", "dinner"];
    let completed = 0;
    const total = 21; // 7 days × 3 meals
  
    days.forEach((day) => {
      meals.forEach((meal) => {
        if (progress[day]?.[meal] && !skippedMeals?.[day]?.[meal]) {
          completed++;
        }
      });
    });
  
    return {
      percent: Math.round((completed / total) * 100),
      completed,
      total,
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

  const getActivityLevelLabel = (value) => {
    const activityValue = String(value);
    
    switch(activityValue) {
      case '1.2': return 'Sedentary';
      case '1.4': return 'Lightly Active';
      case '1.5': return 'Moderately Active';
      case '1.7': return 'Very Active';
      case '1.9': return 'Extra Active';
      default: return value; 
    }
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return 'Unknown';
    
    const numericBMI = parseFloat(bmi);
    if (isNaN(numericBMI)) return 'Unknown';
    
    const category = BMI_CATEGORIES.find(
      cat => numericBMI >= cat.range[0] && numericBMI <= cat.range[1]
    );
    
    return category ? category.label : 'Unknown';
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
              No patients found.
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
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900 mr-2">{parseFloat(patient.BMI).toFixed(1)}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          patient.BMI < 18.5 ? 'bg-blue-200 text-blue-800' :
                          patient.BMI < 23 ? 'bg-green-200 text-green-800' :
                          patient.BMI < 25 ? 'bg-yellow-300 text-yellow-800' :
                          patient.BMI < 30 ? 'bg-orange-200 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getBMICategory(patient.BMI)}
                        </span>
                      </div>
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
                        Dismiss
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
                                BMI: {parseFloat(patient.BMI).toFixed(1)} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  patient.BMI < 18.5 ? 'bg-blue-200 text-blue-800' :
                                  patient.BMI < 23 ? 'bg-green-200 text-green-800' :
                                  patient.BMI < 25 ? 'bg-yellow-300 text-yellow-800' :
                                  patient.BMI < 30 ? 'bg-orange-200 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>{getBMICategory(patient.BMI)}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                TDEE: {patient.TDEE} calories
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
                                Dietary Preference: {patient.preference}  
                              </p>
                              <p className="text-sm text-gray-600">
                                Restrictions: {patient.restrictions}
                              </p>
                              <p className="text-sm text-gray-600">
                                Activity Level: {getActivityLevelLabel(patient.activity_level)} ({patient.activity_level})
                              </p>
                            </div>
                          </div>
                        </div>
                        {calculateProgress(patient.progress, patient.skippedMeals) >= 0}
                        
                        <div className="w-full px-2">
                          <div ref={expandRef} className="mb-2 text-sm italic text-gray-600">
                            Click the recipe name for more information
                          </div>
                          
                          <div className="days-grid">
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday", 
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => (
                              <div key={day} className="mb-4 rounded-lg">
                                <div className="bg-white p-4 rounded-lg shadow">
                                  {/* Day header with a more prominent styling */}
                                  <h4 className="text-xl font-semibold text-green-700 mb-4 border-b pb-2 flex justify-between items-center">
                                    <span>{day}</span>
                                    {patient.prediction?.[day]?.date && (
                                      <span className="text-sm text-gray-500">
                                        {new Date(patient.prediction[day].date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </h4>
                                  
                                  {/* Meals displayed horizontally in a row */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {meals.map((meal) => {
                                      const dayData = patient.prediction?.[day] || {};
                                      return (
                                        <div key={meal} className="meal-details p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                                          <h4 className="text-lg font-semibold text-green-600 mb-3 capitalize border-b pb-2">
                                            {meal}
                                            
                                            {/* Add meal progress indicator */}
                                            <span className="ml-2">
                                              {patient.progress?.[day]?.[meal] ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                  </svg>
                                                  Completed
                                                </span>
                                              ) : patient.skippedMeals?.[day]?.[meal] ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                  </svg>
                                                  Skipped
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                  Pending
                                                </span>
                                              )}
                                            </span>
                                          </h4>

                                          {/* Add Skip Message if meal was skipped */}
                                          {patient.skippedMeals?.[day]?.[meal] && patient.mealNotes?.[day]?.[meal] && (
                                            <div className="mt-2 mb-3 p-2 bg-red-50 border border-red-100 rounded-md">
                                              <p className="text-xs font-medium text-gray-700 mb-1">Patient skip reason:</p>
                                              <p className="text-sm italic text-gray-600">{patient.mealNotes[day][meal]}</p>
                                            </div>
                                          )}
                                          
                                          {/* Main dish */}
                                          <div className="mb-3">
                                            <p className="font-medium hover:text-green-600 cursor-pointer" 
                                              onClick={() => fetchRecipeDetails(dayData[meal])}>
                                              {dayData[meal] || 'No meal planned'}
                                            </p>
                                            
                                            {/* Meal details section */}
                                            {dayData[`${meal}_details`] && (
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
                                                  <span className="block text-xs text-gray-500">Total</span>
                                                  <span className="font-medium">{dayData[`${meal}_details`].total_calories} kcal</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Rice, side dish, and drink components - keeping them as they are */}
                                          {dayData[`${meal}_rice`] && (
                                            <div className="mb-2 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                                              {/* Rice component content */}
                                              <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-yellow-800">Rice</span>
                                                <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                                                  {dayData[`${meal}_rice`].servings} cup(s)
                                                </span>
                                              </div>
                                              <p className="text-sm">{dayData[`${meal}_rice`].title}</p>
                                              <p className="text-xs text-gray-600 mt-1">{dayData[`${meal}_rice`].total_calories} kcal</p>
                                            </div>
                                          )}
                                          
                                          {/* Side dish component */}
                                          {dayData[`${meal}_side_dish`] && dayData[`${meal}_side_dish`].title && (
                                            <div className="mb-2 p-2 bg-green-50 rounded-md border border-green-100">
                                              {/* Side dish component content */}
                                              <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-green-800">Side Dish</span>
                                                <span className="text-xs bg-green-100 px-2 py-1 rounded">
                                                  {dayData[`${meal}_side_dish`].servings} serving(s)
                                                </span>
                                              </div>
                                              <p 
                                                className="text-sm cursor-pointer hover:text-green-700" 
                                                onClick={() => fetchRecipeDetails(dayData[`${meal}_side_dish`].title)}
                                              >
                                                {dayData[`${meal}_side_dish`].title}
                                              </p>
                                              <p className="text-xs text-gray-600 mt-1">{dayData[`${meal}_side_dish`].total_calories} kcal</p>
                                            </div>
                                          )}
                                          
                                          {/* Drink component */}
                                          {dayData[`${meal}_drink`] && dayData[`${meal}_drink`].title && (
                                            <div className="mb-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                                              {/* Drink component content */}
                                              <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-blue-800">Drink</span>
                                                <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                                                  {dayData[`${meal}_drink`].servings} serving(s)
                                                </span>
                                              </div>
                                              <p 
                                                className="text-sm cursor-pointer hover:text-blue-700" 
                                                onClick={() => fetchRecipeDetails(dayData[`${meal}_drink`].title)}
                                              >
                                                {dayData[`${meal}_drink`].title}
                                              </p>
                                              <p className="text-xs text-gray-600 mt-1">{dayData[`${meal}_drink`].total_calories} kcal</p>
                                            </div>
                                          )}
                                          
                                          {/* Total meal calories */}
                                          {/* {dayData[`${meal}_meal_total`] && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                                              <span className="text-sm font-medium">Meal Total:</span>
                                              <span className="text-sm font-bold">{dayData[`${meal}_meal_total`]} kcal</span>
                                            </div>
                                          )} */}
                                          
                                          {/* Nutritionist Note Section */}
                                          <div className="mt-2">
                                            {patient.nutritionistNotes?.[day]?.[meal] ? (
                                              <div className="nutritionist-note">
                                                <div className="nutritionist-note-header">
                                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                                  </svg>
                                                  <span>Nutritionist Note</span>
                                                </div>
                                                <div className="nutritionist-note-content">
                                                  {patient.nutritionistNotes[day][meal]}
                                                </div>
                                                <button 
                                                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                                  onClick={() => {
                                                    setEditingNote(`${patient._id}-${day}-${meal}`);
                                                    setNoteText(patient.nutritionistNotes[day][meal] || "");
                                                  }}
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                className="text-xs text-green-600 hover:text-green-800 flex items-center mt-2"
                                                onClick={() => {
                                                  setEditingNote(`${patient._id}-${day}-${meal}`);
                                                  setNoteText("");
                                                }}
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Add Nutritionist Note
                                              </button>
                                            )}
                                            
                                            {/* Note Edit Form */}
                                            {editingNote === `${patient._id}-${day}-${meal}` && (
                                              <div className="note-edit-form">
                                                <textarea
                                                  className="note-edit-textarea"
                                                  value={noteText}
                                                  onChange={(e) => setNoteText(e.target.value)}
                                                  placeholder="Enter your notes for this meal..."
                                                ></textarea>
                                                <div className="note-actions">
                                                  <button
                                                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                                    onClick={() => {
                                                      setEditingNote(null);
                                                      setNoteText("");
                                                    }}
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                    onClick={() => handleNoteSubmit(patient._id, day, meal, noteText)}
                                                  >
                                                    Save
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Daily total calories */}
                                  {/* {patient.prediction?.[day]?.total_calories && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                                      <span className="font-medium text-gray-700">Daily Total:</span>
                                      <span className="font-bold text-green-600">{patient.prediction[day].total_calories} kcal</span>
                                    </div>
                                  )} */}
                                </div>
                              </div>
                            ))}                    
                          </div>
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
    <RecipeModal 
        recipe={selectedRecipe}
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
    />         
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