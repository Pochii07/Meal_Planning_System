const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONG_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Recipe Schema
const recipeSchema = new mongoose.Schema({
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
  sodium: Number,
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

const Recipe = mongoose.model('Recipe', recipeSchema);

// Function to import recipes from CSV
async function importRecipes(filePath) {
  const recipes = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Transform CSV data into recipe object
        const recipe = {
          title: data.title,
          summary: data.summary,
          prep_time: data.prep_time,
          cook_time: data.cook_time,
          servings: data.servings,
          ingredients: data.ingredients,
          instructions: data.instructions,
          calories: Number(data.calories) || 0,
          carbohydrates: Number(data.carbohydrates) || 0,
          protein: Number(data.protein) || 0,
          fat: Number(data.fat) || 0,
          sodium: Number(data.sodium) || 0,
          vegetarian: data.Vegetarian === 'TRUE',
          low_purine: data['Low-Purine'] === 'TRUE',
          low_fat: data['Low-fat/Heart-Healthy'] === 'TRUE',
          low_sodium: data['Low-Sodium'] === 'TRUE',
          lactose_free: data['Lactose-free'] === 'TRUE',
          peanut_allergy_safe: data['Peanut Allergy'] === 'TRUE',
          shellfish_allergy_safe: data['Shellfish Allergy'] === 'TRUE',
          fish_allergy_safe: data['Fish Allergy'] === 'TRUE',
          halal_kosher: data['Halal or Kosher'] === 'TRUE',
        };
        recipes.push(recipe);
      })
      .on('end', async () => {
        try {
          if (recipes.length > 0) {
            await Recipe.insertMany(recipes);
            console.log(`Imported ${recipes.length} recipes from ${filePath}`);
            resolve();
          } else {
            console.log(`No recipes found in ${filePath}`);
            resolve();
          }
        } catch (error) {
          console.error('Error importing recipes:', error);
          reject(error);
        }
      });
  });
}

// Run the import
async function runImport() {
  try {
    // Clear existing recipes
    await Recipe.deleteMany({});
    
    // Import all recipes without specifying meal type
    await importRecipes('../ml/bf_final_updated_recipes_1.csv');
    await importRecipes('../ml/lunch_final_updated_recipes_1.csv');
    
    console.log('Import completed successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Import failed:', error);
    mongoose.disconnect();
  }
}

runImport();