const express = require('express');
const {
    getAllRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeByTitle
} = require('../controllers/recipe_controller');

const router = express.Router();

// Get all recipes
router.get('/', getAllRecipes);

// Get a single recipe
router.get('/:id', getRecipe);

// Create a new recipe
router.post('/', createRecipe);

// Update a recipe
router.patch('/:id', updateRecipe);

// Delete a recipe
router.delete('/:id', deleteRecipe);

// GET a recipe by title
router.get('/title/:title', getRecipeByTitle);

module.exports = router;
