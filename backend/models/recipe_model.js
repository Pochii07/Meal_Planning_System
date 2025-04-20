const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const recipeSchema = new Schema({
  title: String,
  summary: String,
  prep_time: String,
  cook_time: String,
  servings: String,
  ingredients: String,
  instructions: String,
  calories: Number,
  carbohydrates: Number,
  protein: Number,
  fat: Number,
  vegetarian: Boolean,
  low_purine: Boolean,
  low_fat: Boolean,
  low_sodium: Boolean,
  lactose_free: Boolean,
  peanut_allergy_safe: Boolean,
  shellfish_allergy_safe: Boolean,
  fish_allergy_safe: Boolean,
  halal_kosher: Boolean,
});

module.exports = mongoose.model('Recipe', recipeSchema);