const express = require('express');
const router = express.Router();
const {
    getAllRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeByTitle,
    searchFilteredRecipes,
    updateRecipeByTitle  // Make sure this is imported
} = require('../controllers/recipe_controller');
const { verifyToken } = require('../middleware/verifyToken');

// Public routes
router.get('/', getAllRecipes);
router.get('/:id', getRecipe);
router.get('/title/:title', getRecipeByTitle);

// Protected routes
router.post('/search-filtered', verifyToken, searchFilteredRecipes);
router.post('/', verifyToken, createRecipe);
router.patch('/:id', verifyToken, updateRecipe);
router.patch('/title/:title', verifyToken, updateRecipeByTitle); // Fixed typo (was 'pacth')
router.delete('/:id', verifyToken, deleteRecipe);

module.exports = router;