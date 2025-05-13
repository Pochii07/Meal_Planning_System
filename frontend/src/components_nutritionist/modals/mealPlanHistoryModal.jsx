import React, { useState } from 'react';
import { RECIPES_API } from '../../config/api';

const MealPlanHistoryModal = ({ isOpen, onClose, history, patient }) => {
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [recipeModalOpen, setRecipeModalOpen] = useState(false);
    
    if (!isOpen) return null;
    
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const meals = ["breakfast", "lunch", "dinner"];
    
    const currentHistory = history[selectedHistoryIndex] || {};
    
    const fetchRecipeDetails = async (mealName) => {
        if (!mealName) return;
        
        try {
            const response = await fetch(`${RECIPES_API}/title/${encodeURIComponent(mealName)}`);
            if (response.ok) {
                const recipeData = await response.json();
                setSelectedRecipe(recipeData);
                setRecipeModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            Meal Plan History - {patient?.firstName} {patient?.lastName}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="historySelect" className="block text-sm font-medium text-gray-700 mb-2">
                            Select Date:
                        </label>
                        <select
                            id="historySelect"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                            value={selectedHistoryIndex}
                            onChange={(e) => setSelectedHistoryIndex(Number(e.target.value))}
                        >
                            {history.map((item, index) => (
                                <option key={index} value={index}>
                                    {formatDate(item.date)}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {days.map((day) => (
                            <div key={day} className="border rounded-lg shadow-sm p-4 bg-white">
                                <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">{day}</h3>
                                
                                {meals.map((meal) => {
                                    const mealName = currentHistory.prediction?.[day]?.[meal];
                                    const isSkipped = currentHistory.skippedMeals?.[day]?.[meal];
                                    const isCompleted = currentHistory.progress?.[day]?.[meal];
                                    const patientNote = currentHistory.mealNotes?.[day]?.[meal];
                                    const nutritionistNote = currentHistory.nutritionistNotes?.[day]?.[meal];
                                    const mealAddons = currentHistory.mealAddons?.[day]?.[meal];
                                    const dayData = currentHistory.prediction?.[day] || {};
                                    
                                    let statusBadge = "";
                                    if (isSkipped) {
                                        statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-2">Skipped</span>;
                                    } else if (isCompleted) {
                                        statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-2">Completed</span>;
                                    } else {
                                        statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 ml-2">Pending</span>;
                                    }
                                    
                                    return (
                                        <div key={meal} className="mb-4 p-3 bg-gray-50 rounded-md">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium text-gray-800 capitalize">{meal} {statusBadge}</h4>
                                            </div>
                                            
                                            {/* Main dish */}
                                            {mealName && !isSkipped && (
                                                <div className="mb-3">
                                                    <p 
                                                        className="font-medium hover:text-green-600 cursor-pointer" 
                                                        onClick={() => fetchRecipeDetails(mealName)}
                                                    >
                                                        {mealName}
                                                    </p>
                                                    
                                                    {/* Meal details */}
                                                    {dayData[`${meal}_details`] && (
                                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                                            <div className="bg-gray-100 p-2 rounded text-xs">
                                                                <span className="block text-gray-500">Base Calories</span>
                                                                <span className="font-medium">{dayData[`${meal}_details`].calories} kcal</span>
                                                            </div>
                                                            <div className="bg-gray-100 p-2 rounded text-xs">
                                                                <span className="block text-gray-500">Servings</span>
                                                                <span className="font-medium">{dayData[`${meal}_details`].servings}</span>
                                                            </div>
                                                            <div className="bg-gray-100 p-2 rounded text-xs">
                                                                <span className="block text-gray-500">Total</span>
                                                                <span className="font-medium">{dayData[`${meal}_details`].total_calories} kcal</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Rice component */}
                                            {!isSkipped && dayData[`${meal}_rice`] && (
                                                <div className="mb-2 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-yellow-800">Rice</span>
                                                        <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                                                            {dayData[`${meal}_rice`].servings} serving(s)
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{dayData[`${meal}_rice`].title}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{dayData[`${meal}_rice`].total_calories} kcal</p>
                                                </div>
                                            )}
                                            
                                            {/* Side dish */}
                                            {!isSkipped && dayData[`${meal}_side_dish`] && dayData[`${meal}_side_dish`].title && (
                                                <div className="mb-2 p-2 bg-green-50 rounded-md border border-green-100">
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
                                            
                                            {/* Drink */}
                                            {!isSkipped && dayData[`${meal}_drink`] && dayData[`${meal}_drink`].title && (
                                                <div className="mb-2 p-2 bg-blue-50 rounded-md border border-blue-100">
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
                                            
                                            {/* Meal total */}
                                            {!isSkipped && dayData[`${meal}_meal_total`] && (
                                                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                                                    <span className="text-sm font-medium">Meal Total:</span>
                                                    <span className="text-sm font-bold">{dayData[`${meal}_meal_total`]} kcal</span>
                                                </div>
                                            )}
                                            
                                            {/* Addons */}
                                            {mealAddons && mealAddons.length > 0 && (
                                                <div className="mt-3 border-t pt-2">
                                                    <h5 className="text-sm font-medium mb-1">Additional Items:</h5>
                                                    {mealAddons.map((addon, idx) => (
                                                        <div key={idx} className="flex items-center mt-1 p-2 bg-gray-100 rounded">
                                                            <span className={`${addon.completed ? 'text-green-600' : ''} ${addon.skipped ? 'line-through text-gray-400' : ''}`}>
                                                                {addon.text}
                                                            </span>
                                                            {addon.completed && !addon.skipped && (
                                                                <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Completed</span>
                                                            )}
                                                            {addon.skipped && (
                                                                <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Skipped</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Notes */}
                                            {isSkipped && patientNote && (
                                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
                                                    <p className="text-xs font-medium text-gray-700 mb-1">Patient skip reason:</p>
                                                    <p className="text-sm italic text-gray-600">{patientNote}</p>
                                                </div>
                                            )}
                                            
                                            {nutritionistNote && (
                                                <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md">
                                                    <p className="text-xs font-medium text-green-800 mb-1">Nutritionist Note:</p>
                                                    <p className="text-sm text-gray-600">{nutritionistNote}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* Daily total */}
                                {currentHistory.prediction?.[day]?.total_calories && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                                        <span className="font-medium text-gray-700">Daily Total:</span>
                                        <span className="font-bold text-green-600">{currentHistory.prediction[day].total_calories} kcal</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Recipe modal would go here */}
            {recipeModalOpen && selectedRecipe && (
                <RecipeModal 
                    recipe={selectedRecipe}
                    isOpen={recipeModalOpen}
                    onClose={() => setRecipeModalOpen(false)}
                />
            )}
        </div>
    );
};

export default MealPlanHistoryModal;