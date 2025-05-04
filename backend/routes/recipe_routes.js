const express = require('express');
const {
    getAllRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeByTitle,
    searchRecipes
} = require('../controllers/recipe_controller');

const router = express.Router();

router.get('/search', searchRecipes);
router.get('/title/:title', getRecipeByTitle);

router.get('/', getAllRecipes);
router.get('/:id', getRecipe);
router.post('/', createRecipe);
router.patch('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

module.exports = router;
