import React from 'react';

const RecipeModal = ({ recipe, isOpen, onClose, onConfirm }) => {
  // Return null if no recipe or modal isn't open
  if (!isOpen || !recipe) return null;

  // Helper function to safely split strings
  const safeSplit = (str, delimiter) => {
    if (!str) return [];
    return str.split(delimiter).filter(item => item.trim());
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
          <button 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        
          <h2 className="text-2xl font-bold text-gray-800 mb-2 pr-8">
            {recipe.title || 'No title available'}
          </h2>
        
          {recipe.summary && (
            <div className="mb-3">
              <p className="text-gray-600 text-sm">{recipe.summary}</p>
            </div>
          )}
        
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-gray-50 p-2 rounded">
              <span className="block text-xs text-gray-500">Prep Time</span>
              <span className="font-medium text-sm">
                {recipe.prep_time || 'N/A'}
              </span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="block text-xs text-gray-500">Cook Time</span>
              <span className="font-medium text-sm">
                {recipe.cook_time || 'N/A'}
              </span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="block text-xs text-gray-500">Servings</span>
              <span className="font-medium text-sm">
                {recipe.servings || 'N/A'}
              </span>
            </div>
          </div>
        
          <div className="mb-3">
            <h3 className="text-md font-semibold mb-1">Ingredients</h3>
            <div className="bg-gray-50 p-3 rounded">
              <ul className="list-disc pl-5 space-y-0.5 text-sm">
                {safeSplit(recipe.ingredients, ',').map((ingredient, idx) => (
                  <li key={idx}>{ingredient.trim()}</li>
                ))}
              </ul>
            </div>
          </div>
        
          <div className="mb-3">
            <h3 className="text-md font-semibold mb-1">Instructions</h3>
            <div className="bg-gray-50 p-3 rounded">
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {safeSplit(recipe.instructions, '.').map((step, idx) => (
                  <li key={idx}>{step.trim()}{!step.trim().endsWith('.') && '.'}</li>
                ))}
              </ol>
            </div>
          </div>
        
          <div className="mb-3">
            <h3 className="text-md font-semibold mb-1">Nutrition Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Calories</span>
                <span className="font-medium text-sm">
                  {recipe.calories || 'N/A'}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Carbs</span>
                <span className="font-medium text-sm">
                  {recipe.carbohydrates ? `${recipe.carbohydrates}g` : 'N/A'}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Protein</span>
                <span className="font-medium text-sm">
                  {recipe.protein ? `${recipe.protein}g` : 'N/A'}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-xs text-gray-500">Fat</span>
                <span className="font-medium text-sm">
                  {recipe.fat ? `${recipe.fat}g` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="px-4 py-2 border rounded hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={onConfirm}
            >
              Confirm Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;