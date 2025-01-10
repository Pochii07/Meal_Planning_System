const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RecipeSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    ingredients: {
        type: [String],
        required: true,
    },
    procedure: {
        type: String,
        required: true,
    },
    preference: {
        type: String,
        required: false,
    },
    restrictions: {
        type: String,
        required: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', RecipeSchema);
