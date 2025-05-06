import React from 'react';

const RecipeModal = ({ recipe, isOpen, onClose }) => {
  if (!isOpen || !recipe) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 relative max-h-[80vh] overflow-y-auto">
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          onClick={onClose}
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2 pr-8">{recipe.title}</h2>
        
        <div className="mb-3">
          <p className="text-gray-600 text-sm">{recipe.summary}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Prep Time</span>
            <span className="font-medium text-sm">{recipe.prep_time}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Cook Time</span>
            <span className="font-medium text-sm">{recipe.cook_time}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Servings</span>
            <span className="font-medium text-sm">{recipe.servings}</span>
          </div>
        </div>
        
        <div className="mb-3">
          <h3 className="text-md font-semibold mb-1">Ingredients</h3>
          <div className="bg-gray-50 p-3 rounded">
            <ul className="list-disc pl-5 space-y-0.5 text-sm">
              {recipe.ingredients.split(',').map((ingredient, idx) => (
                <li key={idx}>{ingredient.trim()}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mb-3">
          <h3 className="text-md font-semibold mb-1">Instructions</h3>
          <div className="bg-gray-50 p-3 rounded">
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              {recipe.instructions.split('.').filter(step => step.trim()).map((step, idx) => (
                <li key={idx}>{step.trim()}.</li>
              ))}
            </ol>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Calories</span>
            <span className="font-medium text-sm">{recipe.calories} kcal</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Carbs</span>
            <span className="font-medium text-sm">{recipe.carbohydrates}g</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Protein</span>
            <span className="font-medium text-sm">{recipe.protein}g</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Fat</span>
            <span className="font-medium text-sm">{recipe.fat}g</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-xs text-gray-500">Sodium</span>
            <span className="font-medium text-sm">{recipe.sodium}mg</span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;