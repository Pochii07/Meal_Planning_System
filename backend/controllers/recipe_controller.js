const Recipe = require('../models/recipe_model');
const mongoose = require('mongoose');

// Get all recipes
const getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({}).sort({ createdAt: -1 });
        res.status(200).json(recipes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single recipe
const getRecipe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    try {
        const recipe = await Recipe.findById(id);
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a new recipe
const createRecipe = async (req, res) => {
    const { title, ingredients, procedure, preference, restrictions } = req.body;

    if (!title || !ingredients || !procedure) {
        return res.status(400).json({ error: 'Title, ingredients, and procedure are required' });
    }

    try {
        const recipe = await Recipe.create({ title, ingredients, procedure, preference, restrictions });
        res.status(201).json(recipe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a recipe
const updateRecipe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    try {
        const recipe = await Recipe.findByIdAndUpdate(id, req.body, { new: true });
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        res.status(200).json(recipe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a recipe
const deleteRecipe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    try {
        const recipe = await Recipe.findByIdAndDelete(id);
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        res.status(200).json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
};
