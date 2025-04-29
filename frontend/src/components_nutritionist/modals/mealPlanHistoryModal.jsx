import React, { useState } from 'react';
import { Dialog } from '@mui/material';

const MealPlanHistoryModal = ({ isOpen, onClose, history, patient }) => {
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
    
    // Format date for better display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (!history || history.length === 0) {
        return (
            <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Meal Plan History</h2>
                    <p>No history available for this patient.</p>
                    <div className="mt-4 flex justify-end">
                        <button 
                            className="px-4 py-2 bg-green-600 text-white rounded"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Dialog>
        );
    }

    // Get current history item
    const currentHistory = history[selectedHistoryIndex];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const meals = ["breakfast", "lunch", "dinner"];

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Meal Plan History</h2>
                
                {/* History selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Plan Date:
                    </label>
                    <select 
                        className="w-full p-2 border rounded"
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
                
                {/* Integrated view of meals, progress and notes */}
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
                                
                                let statusBadge = "";
                                if (isSkipped) {
                                    statusBadge = <span className="ml-2 text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded">Skipped</span>;
                                } else if (isCompleted) {
                                    statusBadge = <span className="ml-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded">Completed</span>;
                                } else {
                                    statusBadge = <span className="ml-2 text-xs font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Not Completed</span>;
                                }
                                
                                return (
                                    <div key={`${day}-${meal}`} className="mb-4 p-3 border rounded bg-gray-50">
                                        <div className="flex items-center mb-2">
                                            <span className="font-medium capitalize text-gray-900">{meal}</span>
                                            {statusBadge}
                                        </div>
                                        
                                        <div className="mb-2">
                                            <span className={`${isSkipped ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                {mealName || 'No meal planned'}
                                            </span>
                                        </div>
                                        
                                        {/* Notes section */}
                                        <div className="space-y-2 mt-2">
                                            {patientNote && (
                                                <div className="p-2 bg-blue-50 rounded text-sm border border-blue-100">
                                                    <span className="block text-xs font-medium text-blue-800">Patient Note:</span>
                                                    <p className="text-gray-800">{patientNote}</p>
                                                </div>
                                            )}
                                            
                                            {nutritionistNote && (
                                                <div className="p-2 bg-green-50 rounded text-sm border border-green-100">
                                                    <span className="block text-xs font-medium text-green-800">Nutritionist Note:</span>
                                                    <p className="text-gray-800">{nutritionistNote}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button 
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </Dialog>
    );
};

export default MealPlanHistoryModal;