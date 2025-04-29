const Recipe = require('../models/recipe_model');
const mongoose = require('mongoose');

const searchFilteredRecipes = async (req, res) => {
    const { query, preferences = {}, restrictions = {} } = req.body;

    // Ensure query is not null, undefined, or empty
    if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({ success: false, error: 'Query must be a non-empty string' });
    }

    console.log('Received search request with query:', query);
    console.log('Preferences:', preferences);
    console.log('Restrictions:', restrictions);

    try {
        let searchQuery = { $text: { $search: query.trim() } };  // Text search query

        // Add dietary preferences filters
        if (preferences.vegetarian) searchQuery.vegetarian = true;
        if (preferences.low_purine) searchQuery.low_purine = true;
        if (preferences.low_fat) searchQuery.low_fat = true;
        if (preferences.low_sodium) searchQuery.low_sodium = true;

        // Add dietary restrictions filters
        if (restrictions.lactose_free) searchQuery.lactose_free = true;
        if (restrictions.peanut_allergy_safe) searchQuery.peanut_allergy_safe = true;
        if (restrictions.shellfish_allergy_safe) searchQuery.shellfish_allergy_safe = true;
        if (restrictions.fish_allergy_safe) searchQuery.fish_allergy_safe = true;
        if (restrictions.halal_kosher) searchQuery.halal_kosher = true;

        console.log('Final search query:', searchQuery);

        // Perform the query
        const results = await Recipe.find(searchQuery)
            .limit(50)  // Limit results for performance
            .sort({ title: 1 });  // Sort alphabetically by title

        console.log('Search results found:', results.length);

        if (results.length === 0) {
            return res.status(404).json({ message: 'No recipes found matching your criteria' });
        }

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    } catch (error) {
        console.error('Search error details:', error);  // Full error details
        console.error('Stack trace:', error.stack);  // Print the stack trace to pinpoint error location
    
        res.status(500).json({
            success: false,
            error: `Server error during recipe search: ${error.message}`
        });
    }
};



// Get all recipes
const getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({}).sort({ createdAt: -1 });
        console.log('All recipes fetched:', recipes.length);  // Debug log for fetched recipes
        res.status(200).json(recipes);
    } catch (error) {
        console.error('Error fetching all recipes:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a single recipe by ID
const getRecipe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid recipe ID:', id);  // Debug log for invalid ID
        return res.status(404).json({ error: 'Recipe not found' });
    }

    try {
        const recipe = await Recipe.findById(id);
        if (!recipe) {
            console.log('Recipe not found:', id);  // Debug log for missing recipe
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.status(200).json(recipe);
    } catch (error) {
        console.error('Error fetching recipe by ID:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a recipe by title
const getRecipeByTitle = async (req, res) => {
    const { title } = req.params;

    console.log('Fetching recipe by title:', title);  // Debug log for title lookup

    try {
        const recipe = await Recipe.findOne({
            title: { $regex: new RegExp(`^${title}$`, 'i') },  // Case-insensitive search
        });

        if (!recipe) {
            console.log('Recipe not found for title:', title);  // Debug log for missing recipe
            return res.status(404).json({ error: 'Recipe not found' });
        }

        console.log('Found recipe:', recipe.title);  // Debug log for found recipe
        res.status(200).json(recipe);
    } catch (error) {
        console.error('Error fetching recipe by title:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add a new recipe
const createRecipe = async (req, res) => {
    const { title, ingredients, procedure, preference, restrictions } = req.body;

    console.log('Creating new recipe with title:', title);  // Debug log for recipe creation

    if (!title || !ingredients || !procedure) {
        return res.status(400).json({ error: 'Title, ingredients, and procedure are required' });
    }

    try {
        const recipe = await Recipe.create({ title, ingredients, procedure, preference, restrictions });
        console.log('Recipe created successfully:', recipe.title);  // Debug log for created recipe
        res.status(201).json(recipe);
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(400).json({ error: error.message });
    }
};

// Update a recipe
const updateRecipe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid recipe ID for update:', id);  // Debug log for invalid ID
        return res.status(404).json({ error: 'Recipe not found' });
    }

    try {
        const recipe = await Recipe.findByIdAndUpdate(id, req.body, { new: true });
        if (!recipe) {
            console.log('Recipe not found for update:', id);  // Debug log for missing recipe
            return res.status(404).json({ error: 'Recipe not found' });
        }
        console.log('Recipe updated successfully:', recipe.title);  // Debug log for updated recipe
        res.status(200).json(recipe);
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(400).json({ error: error.message });
    }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid recipe ID for deletion:', id);  // Debug log for invalid ID
        return res.status(404).json({ error: 'Recipe not found' });
    }

    try {
        const recipe = await Recipe.findByIdAndDelete(id);
        if (!recipe) {
            console.log('Recipe not found for deletion:', id);  // Debug log for missing recipe
            return res.status(404).json({ error: 'Recipe not found' });
        }
        console.log('Recipe deleted successfully:', recipe.title);  // Debug log for deleted recipe
        res.status(200).json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeByTitle,
    searchFilteredRecipes
};
