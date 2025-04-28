import React, { useState } from 'react';
import { Dialog, Tabs, Tab, Box } from '@mui/material';

const MealPlanHistoryModal = ({ isOpen, onClose, history, patient }) => {
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
    const [selectedTab, setSelectedTab] = useState('meals');
    
    // Format date for better display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
    
    // Handle tab changes
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
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
                
                {/* Tabs for meals/progress/notes */}
                <Box sx={{ width: '100%', mb: 4 }}>
                    <Tabs value={selectedTab} onChange={handleTabChange} centered>
                        <Tab value="meals" label="Meal Plan" />
                        <Tab value="progress" label="Progress" />
                        <Tab value="notes" label="Notes" />
                    </Tabs>
                </Box>

                {/* Meal Plan Tab */}
                {selectedTab === 'meals' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {days.map((day) => (
                            <div key={day} className="border rounded p-4">
                                <h3 className="font-bold text-lg mb-2">{day}</h3>
                                {meals.map((meal) => (
                                    <div key={`${day}-${meal}`} className="mb-2">
                                        <span className="font-medium capitalize">{meal}: </span>
                                        <span className={currentHistory.skippedMeals?.[day]?.[meal] ? 'line-through text-red-600' : ''}>
                                            {currentHistory.prediction?.[day]?.[meal] || 'No meal'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Progress Tab */}
                {selectedTab === 'progress' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {days.map((day) => (
                            <div key={day} className="border rounded p-4">
                                <h3 className="font-bold text-lg mb-2">{day}</h3>
                                {meals.map((meal) => {
                                    const isSkipped = currentHistory.skippedMeals?.[day]?.[meal];
                                    const isCompleted = currentHistory.progress?.[day]?.[meal];
                                    let status = "Not completed";
                                    let statusColor = "text-gray-500";
                                    
                                    if (isSkipped) {
                                        status = "Skipped";
                                        statusColor = "text-red-500";
                                    } else if (isCompleted) {
                                        status = "Completed";
                                        statusColor = "text-green-500";
                                    }
                                    
                                    return (
                                        <div key={`${day}-${meal}`} className="mb-2 flex justify-between">
                                            <span className="font-medium capitalize">{meal}: </span>
                                            <span className={statusColor}>{status}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Notes Tab */}
                {selectedTab === 'notes' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {days.map((day) => (
                            <div key={day} className="border rounded p-4">
                                <h3 className="font-bold text-lg mb-2">{day}</h3>
                                {meals.map((meal) => {
                                    const patientNote = currentHistory.mealNotes?.[day]?.[meal];
                                    const nutritionistNote = currentHistory.nutritionistNotes?.[day]?.[meal];
                                    
                                    return (
                                        <div key={`${day}-${meal}`} className="mb-3">
                                            <span className="font-medium capitalize">{meal}:</span>
                                            
                                            {/* Patient notes section */}
                                            {patientNote ? (
                                                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                                                    <span className="text-xs text-gray-500">Patient note:</span>
                                                    <div>{patientNote}</div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">No patient notes</div>
                                            )}
                                            
                                            {/* Nutritionist notes section */}
                                            {nutritionistNote && (
                                                <div className="mt-1 p-2 bg-green-50 rounded text-sm border border-green-100">
                                                    <span className="text-xs text-gray-500">Your note:</span>
                                                    <div>{nutritionistNote}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-6 flex justify-end">
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
};

export default MealPlanHistoryModal;