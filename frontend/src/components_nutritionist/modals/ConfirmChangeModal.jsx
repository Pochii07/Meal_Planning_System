const ConfirmChangeModal = ({ currentMeal, newRecipe, onCancel, onConfirm }) => {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Confirm Meal Change</h3>
        <p className="text-gray-600 mb-4">
          Replace <span className="font-semibold">{currentMeal}</span> with <span className="font-semibold">{newRecipe.title}</span>?
        </p>

        <h4 className="font-semibold mb-2">New Recipe Details:</h4>
        <h5 className="text-lg font-medium">{newRecipe.title}</h5>
        <p className="text-sm text-gray-600 mb-2">{newRecipe.summary}</p>

        <h5 className="font-semibold mt-3 mb-1">Ingredients:</h5>
        <ul className="list-disc list-inside mb-4 text-sm">
          {newRecipe.ingredients.split(',').map((ingredient, idx) => (
            <li key={idx}>{ingredient.trim()}</li>
          ))}
        </ul>

        {newRecipe.instructions && (
          <>
            <h5 className="font-semibold mb-1">Instructions:</h5>
            <ol className="list-decimal list-inside text-sm">
              {newRecipe.instructions.split('.').filter(i => i.trim()).map((step, idx) => (
                <li key={idx}>{step.trim()}.</li>
              ))}
            </ol>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 border rounded hover:bg-gray-100"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => {
            onConfirm();  // Trigger the meal change onConfirm
            onCancel();   // Close the modal after confirming
          }}
        >
          Confirm Change
        </button>
      </div>
    </div>
  );
};
