from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os
import traceback
from typing import Dict, Any, Union, List
from dataclasses import dataclass

# Import the revised MealPlanner
from revise import MealPlanner, DietaryPreferences

# Initialize the Flask app
app = Flask(__name__)
# Enable CORS for all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Helper function to convert numpy types to Python native types for JSON serialization
def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

# Initialize the meal planner with data files
planner = MealPlanner(
    breakfast_path='bf_revised.csv',
    lunch_path='lunch_revised.csv',
    sidedish_path='sidedish_recipes.csv',
    drink_path='drinks_recipes.csv'
)

@app.route('/predict', methods=['POST'])
def predict_meal_plan():
    try:
        # Get input data from request
        data = request.json
        tdee = int(data.get('TDEE', 2000))
        
        # Parse dietary preferences
        preferences = DietaryPreferences(
            vegetarian=data.get('vegetarian', False),
            low_purine=data.get('low_purine', False),
            low_fat=data.get('low_fat', False),
            low_sodium=data.get('low_sodium', False),
            lactose_free=data.get('lactose_free', False),
            peanut_allergy=data.get('peanut_allergy', False),
            shellfish_allergy=data.get('shellfish_allergy', False),
            fish_allergy=data.get('fish_allergy', False),
            halal_or_kosher=data.get('halal_or_kosher', False)
        )
        
        # Generate weekly meal plan
        weekly_plan = planner.generate_weekly_plan(tdee, preferences)
        
        # Format the meal plan for the frontend
        dated_weekly_plan = {}
        start_date = datetime.now().date()
        
        for i, day in enumerate(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            
            # Structure data in the expected format
            dated_weekly_plan[date_str] = {
                'date': date_str,
                'day': day,
                'meals': {
                    'breakfast': {
                        'title': weekly_plan[day]['Breakfast']['title'],
                        'calories': convert_numpy_types(weekly_plan[day]['Breakfast']['calories']),
                        'servings': convert_numpy_types(weekly_plan[day]['Breakfast']['servings']),
                        'total_calories': convert_numpy_types(weekly_plan[day]['Breakfast']['total_calories']),
                        'rice': {
                            'title': 'Rice',
                            'servings': convert_numpy_types(weekly_plan[day]['Rice_Breakfast']['servings']),
                            'calories': convert_numpy_types(weekly_plan[day]['Rice_Breakfast']['calories']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Rice_Breakfast']['total_calories'])
                        },
                        'side_dish': {
                            'title': weekly_plan[day]['Breakfast_SideDish']['title'],
                            'calories': convert_numpy_types(weekly_plan[day]['Breakfast_SideDish']['calories']),
                            'servings': convert_numpy_types(weekly_plan[day]['Breakfast_SideDish']['servings']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Breakfast_SideDish']['total_calories'])
                        },
                        'drink': {
                            'title': weekly_plan[day]['Breakfast_Drink']['title'],
                            'calories': convert_numpy_types(weekly_plan[day]['Breakfast_Drink']['calories']),
                            'servings': convert_numpy_types(weekly_plan[day]['Breakfast_Drink']['servings']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Breakfast_Drink']['total_calories'])
                        }
                    },
                    'lunch': {
                        'title': weekly_plan[day]['Lunch']['title'],
                        'calories': convert_numpy_types(weekly_plan[day]['Lunch']['calories']),
                        'servings': convert_numpy_types(weekly_plan[day]['Lunch']['servings']),
                        'total_calories': convert_numpy_types(weekly_plan[day]['Lunch']['total_calories']),
                        'rice': {
                            'title': 'Rice',
                            'servings': convert_numpy_types(weekly_plan[day]['Rice_Lunch']['servings']),
                            'calories': convert_numpy_types(weekly_plan[day]['Rice_Lunch']['calories']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Rice_Lunch']['total_calories'])
                        },
                        'side_dish': {
                            'title': weekly_plan[day]['Lunch_SideDish']['title'],
                            'calories': convert_numpy_types(weekly_plan[day]['Lunch_SideDish']['calories']),
                            'servings': convert_numpy_types(weekly_plan[day]['Lunch_SideDish']['servings']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Lunch_SideDish']['total_calories'])
                        },
                        'drink': {
                            'title': weekly_plan[day]['Lunch_Drink']['title'],
                            'calories': convert_numpy_types(weekly_plan[day]['Lunch_Drink']['calories']),
                            'servings': convert_numpy_types(weekly_plan[day]['Lunch_Drink']['servings']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Lunch_Drink']['total_calories'])
                        }
                    },
                    'dinner': {
                        'title': weekly_plan[day]['Dinner']['title'],
                        'calories': convert_numpy_types(weekly_plan[day]['Dinner']['calories']),
                        'servings': convert_numpy_types(weekly_plan[day]['Dinner']['servings']),
                        'total_calories': convert_numpy_types(weekly_plan[day]['Dinner']['total_calories']),
                        'rice': {
                            'title': 'Rice',
                            'servings': convert_numpy_types(weekly_plan[day]['Rice_Dinner']['servings']),
                            'calories': convert_numpy_types(weekly_plan[day]['Rice_Dinner']['calories']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Rice_Dinner']['total_calories'])
                        },
                        'side_dish': {
                            'title': weekly_plan[day]['Dinner_SideDish']['title'],
                            'calories': convert_numpy_types(weekly_plan[day]['Dinner_SideDish']['calories']),
                            'servings': convert_numpy_types(weekly_plan[day]['Dinner_SideDish']['servings']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Dinner_SideDish']['total_calories'])
                        },
                        'drink': {
                            'title': weekly_plan[day]['Dinner_Drink']['title'],
                            'calories': convert_numpy_types(weekly_plan[day]['Dinner_Drink']['calories']),
                            'servings': convert_numpy_types(weekly_plan[day]['Dinner_Drink']['servings']),
                            'total_calories': convert_numpy_types(weekly_plan[day]['Dinner_Drink']['total_calories'])
                        }
                    }
                }
            }
        
        # Calculate daily calorie totals
        for date, day_data in dated_weekly_plan.items():
            total_calories = 0
            for meal_type, meal in day_data['meals'].items():
                meal_total = (
                    meal['total_calories'] + 
                    meal['rice']['total_calories'] + 
                    meal['side_dish']['total_calories'] + 
                    meal['drink']['total_calories']
                )
                meal['meal_total_calories'] = meal_total
                total_calories += meal_total
            day_data['total_calories'] = total_calories
        
        return jsonify({'predicted_meal_plan': dated_weekly_plan})
        
    except Exception as e:
        print(f"Error in predict_meal_plan: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/evaluate', methods=['POST'])
def evaluate_meal_plan():
    try:
        # Get input data for evaluation
        data = request.json
        tdee = int(data.get('TDEE', 2000))
        
        # Parse dietary preferences
        preferences = DietaryPreferences(
            vegetarian=data.get('vegetarian', False),
            low_purine=data.get('low_purine', False),
            low_fat=data.get('low_fat', False),
            low_sodium=data.get('low_sodium', False),
            lactose_free=data.get('lactose_free', False),
            peanut_allergy=data.get('peanut_allergy', False),
            shellfish_allergy=data.get('shellfish_allergy', False),
            fish_allergy=data.get('fish_allergy', False),
            halal_or_kosher=data.get('halal_or_kosher', False)
        )
        
        # Number of trials for evaluation
        n_trials = int(data.get('n_trials', 10))
        
        # Run evaluation
        metrics = planner.evaluate_meal_plan_recommendations(tdee, preferences, n_trials)
        
        # Convert numpy values to Python native types
        metrics_dict = {k: convert_numpy_types(v) for k, v in metrics.items()}
        
        return jsonify({'evaluation_metrics': metrics_dict})
        
    except Exception as e:
        print(f"Error in evaluate_meal_plan: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)