import React, { useState, useEffect } from 'react';

const ChangeMealModal = ({
  isOpen,
  onClose,
  currentMeal,
  onRecipeSelect,
  searchQuery,
  setSearchQuery,
  mealSuggestions,
  searchError,
  isSearching,
  onSearch
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={() => {
            onClose();
            setSelectedRecipe(null);
          }}
        >
          ×
        </button>
        
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Change Meal: {currentMeal || 'No meal selected'}
        </h2>
        
        {!selectedRecipe ? (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meals..."
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-green-500 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onSearch();
                  }
                }}
              />
              <button
                onClick={onSearch}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Search
              </button>
            </div>

            {searchError && (
              <div className="text-red-500 mb-4">{searchError}</div>
            )}

            {isSearching && (
              <div className="text-gray-500 mb-4">Searching...</div>
            )}

            {mealSuggestions.length > 0 && (
              <div className="space-y-2">
                {mealSuggestions.map((recipe) => (
                  <div
                    key={recipe._id}
                    className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <h4 className="font-medium">{recipe.title}</h4>
                    <p className="text-sm text-gray-600">{recipe.summary}</p>
                    <p className="text-sm text-green-600 font-semibold mt-1">
                      {recipe.calories} Calories
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {recipe.vegetarian && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                          Vegetarian
                        </span>
                      )}
                      {recipe.low_fat && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                          Low Fat
                        </span>
                      )}
                      {recipe.low_sodium && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full">
                          Low Sodium
                        </span>
                      )}
                      {recipe.lactose_free && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                          Lactose Free
                        </span>
                      )}
                      {recipe.peanut_allergy_safe && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                          Contains Peanuts
                        </span>
                      )}
                      {recipe.shellfish_allergy_safe && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                          Contains Shellfish
                        </span>
                      )}
                      {recipe.fish_allergy_safe && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                          Contains Fish
                        </span>
                      )}
                      {recipe.halal_kosher && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                          Halal/Kosher
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <ConfirmChangeModal
            currentMeal={currentMeal}
            newRecipe={selectedRecipe}
            onCancel={() => setSelectedRecipe(null)}
            onConfirm={() => {
              onRecipeSelect(selectedRecipe);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ChangeMealModal;