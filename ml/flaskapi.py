from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from dataclasses import dataclass
import json
import os
from datetime import datetime, timedelta
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score

# Helper functions for TDEE calculation
def calculate_bmr(weight, height, age, gender):
    """
    Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
    
    Parameters:
    weight - in kg
    height - in cm
    age - in years
    gender - 'M' for male, 'F' for female
    """
    if gender.upper() == "M":
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        return (10 * weight) + (6.25 * height) - (5 * age) - 161

def calculate_tdee(bmr, activity_level):
    """
    Calculate Total Daily Energy Expenditure (TDEE) by multiplying BMR by activity level factor.
    """
    return bmr * activity_level

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    import numpy as np
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

# Initialize the Flask app
app = Flask(__name__)
# Enable CORS for all origins
CORS(app, resources={r"/*": {"origins": "*"}})

@dataclass
class DietaryPreferences:
    vegetarian: bool = False
    low_purine: bool = False
    low_fat: bool = False
    low_sodium: bool = False
    lactose_free: bool = False
    peanut_allergy: bool = False
    shellfish_allergy: bool = False
    fish_allergy: bool = False
    halal_or_kosher: bool = False
    
    def to_array(self) -> np.ndarray:
        return np.array([[
            self.vegetarian, self.low_purine, self.low_fat,
            self.low_sodium, self.lactose_free, self.peanut_allergy,
            self.shellfish_allergy, self.fish_allergy, self.halal_or_kosher
        ]], dtype=float)

class MealPlanner:
    def __init__(self, breakfast_path: str, lunch_path: str):
        self.breakfast_data = pd.read_csv(breakfast_path)
        self.lunch_data = pd.read_csv(lunch_path)
        self.data = pd.concat([self.breakfast_data, self.lunch_data], ignore_index=True)
        self.dietary_columns = [
            'Vegetarian', 'Low-Purine', 'Low-fat/Heart-Healthy', 
            'Low-Sodium', 'Lactose-free', 'Peanut Allergy', 
            'Shellfish Allergy', 'Fish Allergy', 'Halal or Kosher'
        ]
        
        self.rf_model, self.kmeans_model, self.scaler = self._train_models()

    def _train_models(self) -> Tuple[RandomForestClassifier, KMeans, StandardScaler]:
        # Prepare data
        self.data['calorie_range'] = self._create_calorie_ranges(self.data['calories'])
        self.data = self.data.dropna(subset=['calories', 'calorie_range'])

        # Train Random Forest
        X = self.data[['calories']]
        y = self.data['calorie_range']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        rf = RandomForestClassifier(n_estimators=50, random_state=42)
        rf.fit(X_train, y_train)

        # Train K-means
        features = self.data[self.dietary_columns].values
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Using n_init='auto' as in test24.py
        kmeans = KMeans(n_clusters=22, n_init='auto', random_state=42)
        kmeans.fit(features_scaled)

        return rf, kmeans, scaler

    @staticmethod
    def _create_calorie_ranges(calories: pd.Series, tolerance: int = 30) -> pd.Series:
        bins = list(range(0, 2501, tolerance))
        labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)]
        return pd.cut(calories, bins=bins, labels=labels)

    def generate_weekly_plan(self, tdee: int, preferences: DietaryPreferences) -> Dict:
        filtered_data = self._filter_by_preferences(preferences)
        weekly_plan = {}
        
        # Use dictionaries to track meal usage counts instead of sets
        breakfast_meal_counts = {}
        lunch_dinner_meal_counts = {}
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for day in days:
            daily_meals = self._generate_daily_meals_with_variety(
                filtered_data, tdee, breakfast_meal_counts, lunch_dinner_meal_counts
            )
            
            # Update usage counters
            breakfast_title = daily_meals['Breakfast']['title']
            lunch_title = daily_meals['Lunch']['title']
            dinner_title = daily_meals['Dinner']['title']
            
            breakfast_meal_counts[breakfast_title] = breakfast_meal_counts.get(breakfast_title, 0) + 1
            lunch_dinner_meal_counts[lunch_title] = lunch_dinner_meal_counts.get(lunch_title, 0) + 1
            lunch_dinner_meal_counts[dinner_title] = lunch_dinner_meal_counts.get(dinner_title, 0) + 1
            
            weekly_plan[day] = daily_meals

        return weekly_plan

    def _filter_by_preferences(self, preferences: DietaryPreferences) -> pd.DataFrame:
        # Start with all data
        filtered_data = self.data.copy()
        pref_array = preferences.to_array()[0]
        
        # Step 1: Apply critical dietary restrictions (non-negotiable ones)
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i] and any(x in column.lower() for x in ['allergy', 'halal', 'kosher']):
                filtered_data = filtered_data[filtered_data[column] == True]
                
        # Step 2: Use Random Forest to select meals within appropriate calorie ranges
        target_prediction_counts = {}
        
        # Get calorie range distribution from RandomForest predictions
        for meal_type in ['breakfast', 'lunch/dinner']:
            if meal_type == 'breakfast':
                meal_data = filtered_data[filtered_data['title'].isin(self.breakfast_data['title'])]
            else:
                meal_data = filtered_data[filtered_data['title'].isin(self.lunch_data['title'])]
                
            if not meal_data.empty:
                # Use DataFrame with proper column names for prediction
                calories_df = pd.DataFrame({'calories': meal_data['calories']})
                predictions = self.rf_model.predict(calories_df)
                unique_predictions, counts = np.unique(predictions, return_counts=True)
                target_prediction_counts[meal_type] = dict(zip(unique_predictions, counts))
        
        # Step 3: Apply preference-based filtering
        min_required_options = 10
        
        # Define which dietary preferences are considered "soft constraints"
        soft_constraints = ['Vegetarian', 'Low-Purine', 'Low-fat/Heart-Healthy', 
                           'Low-Sodium', 'Lactose-free']
        
        # Try direct filtering with preferences
        temp_data = filtered_data.copy()
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i] and column in soft_constraints:
                temp_data = temp_data[temp_data[column] == True]
        
        # Always use strictly filtered data as in test24.py
        filtered_data = temp_data
        
        # Final safety check
        if filtered_data.empty:
            raise ValueError("Cannot find any meals matching your strict dietary requirements")
            
        return filtered_data

    def _generate_daily_meals_with_variety(
            self, filtered_data: pd.DataFrame, tdee: int, 
            breakfast_meal_counts: dict, lunch_dinner_meal_counts: dict
        ) -> Dict:
            """Generate daily meals with variety within a day and minimizing repetition across the week."""
            adjusted_tdee = tdee - 600  # Account for rice (600 calories)
            meal_calories = adjusted_tdee // 3
            calorie_margin = 50  # Allow 50 calorie variation per meal

            # Create masks for breakfast and lunch datasets
            breakfast_mask = filtered_data['title'].isin(self.breakfast_data['title'])
            lunch_mask = filtered_data['title'].isin(self.lunch_data['title'])

            # Filter options
            breakfast_options = filtered_data[breakfast_mask]
            lunch_dinner_options = filtered_data[lunch_mask]
            
            # Further filter by calories
            breakfast_options = breakfast_options[
                (breakfast_options['calories'] >= meal_calories - calorie_margin) &
                (breakfast_options['calories'] <= meal_calories + calorie_margin)
            ]
            lunch_dinner_options = lunch_dinner_options[
                (lunch_dinner_options['calories'] >= meal_calories - calorie_margin) &
                (lunch_dinner_options['calories'] <= meal_calories + calorie_margin)
            ]
            
            # Ensure we have options available
            if breakfast_options.empty or lunch_dinner_options.empty:
                # Fallback to original options if no meals within calorie range
                breakfast_options = filtered_data[breakfast_mask]
                lunch_dinner_options = filtered_data[lunch_mask]
                if breakfast_options.empty or lunch_dinner_options.empty:
                    raise ValueError("Not enough meal options available for your preferences")
            
            # Try to avoid meals that have been used twice already
            new_breakfast_options = breakfast_options[~breakfast_options['title'].apply(
                lambda x: breakfast_meal_counts.get(x, 0) >= 2
            )]
            if not new_breakfast_options.empty:
                breakfast_options = new_breakfast_options
            
            # Try to avoid lunch/dinner meals that have been used twice already
            new_lunch_dinner_options = lunch_dinner_options[~lunch_dinner_options['title'].apply(
                lambda x: lunch_dinner_meal_counts.get(x, 0) >= 2
            )]
            if not new_lunch_dinner_options.empty and len(new_lunch_dinner_options) >= 2:
                lunch_dinner_options = new_lunch_dinner_options
                
            # Function to round to nearest allowed serving size
            def round_to_serving_size(serving):
                allowed_servings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
                return min(allowed_servings, key=lambda x: abs(x - serving))

            # Sample breakfast
            breakfast = breakfast_options.sample(n=1).iloc[0]
            ideal_breakfast_servings = meal_calories / breakfast['calories'] if breakfast['calories'] > 0 else 1
            breakfast_servings = round_to_serving_size(ideal_breakfast_servings)
            
            # Sample lunch
            lunch = lunch_dinner_options.sample(n=1).iloc[0]
            ideal_lunch_servings = meal_calories / lunch['calories'] if lunch['calories'] > 0 else 1
            lunch_servings = round_to_serving_size(ideal_lunch_servings)
            
            # Sample dinner (ensuring it's different from lunch)
            dinner_options = lunch_dinner_options[lunch_dinner_options['title'] != lunch['title']]
            if dinner_options.empty:
                # If no other options, accept a repeated meal as last resort
                dinner = lunch_dinner_options.sample(n=1).iloc[0]
            else:
                dinner = dinner_options.sample(n=1).iloc[0]
            ideal_dinner_servings = meal_calories / dinner['calories'] if dinner['calories'] > 0 else 1
            dinner_servings = round_to_serving_size(ideal_dinner_servings)

            return {
                'Breakfast': {
                    'title': breakfast['title'], 
                    'calories': breakfast['calories'],
                    'servings': breakfast_servings,
                    'total_calories': breakfast['calories'] * breakfast_servings
                },
                'Lunch': {
                    'title': lunch['title'], 
                    'calories': lunch['calories'],
                    'servings': lunch_servings,
                    'total_calories': lunch['calories'] * lunch_servings
                },
                'Dinner': {
                    'title': dinner['title'], 
                    'calories': dinner['calories'],
                    'servings': dinner_servings,
                    'total_calories': dinner['calories'] * dinner_servings
                }
            }


@app.route('/predict_meal_plan', methods=['POST'])
def predict_meal_plan():
    try:
        data = request.get_json()
        print(f"Received request data: {data}")
        
        # Extract dietary preferences from request format
        dietary_restrictions = data.get('dietary_restrictions', [])
        allergies = data.get('allergies', [])
        
        # Handle different formats of dietary_restrictions
        if isinstance(dietary_restrictions, dict):
            diet_list = [k for k, v in dietary_restrictions.items() if v]
        elif isinstance(dietary_restrictions, list):
            diet_list = dietary_restrictions
        elif isinstance(dietary_restrictions, str):
            diet_list = [r.strip() for r in dietary_restrictions.split(',')]
        else:
            diet_list = []
            
        # Handle allergies string format
        if isinstance(allergies, str):
            allergies = [r.strip() for r in allergies.split(',')]
            
        # Convert all to lowercase for case-insensitive matching
        diet_list = [d.lower() for d in diet_list if d]
        allergies = [a.lower() for a in allergies if a]
        
        # Create preferences object
        preferences = DietaryPreferences(
            vegetarian='vegetarian' in diet_list,
            low_purine='low purine' in diet_list or 'low-purine' in diet_list,
            low_fat='low fat' in diet_list or 'low-fat' in diet_list or 'heart healthy' in diet_list,
            low_sodium='low sodium' in diet_list or 'low-sodium' in diet_list,
            lactose_free='lactose free' in diet_list or 'lactose-free' in diet_list or 'lactose intolerant' in diet_list,
            peanut_allergy=any('peanut' in a.lower() for a in allergies),
            shellfish_allergy=any('shellfish' in a.lower() for a in allergies),
            fish_allergy=any('fish' in a.lower() for a in allergies) and not any('shellfish' in a.lower() for a in allergies),
            halal_or_kosher='halal' in diet_list or 'kosher' in diet_list
        )
        
        # Calculate or use provided TDEE
        try:
            tdee = int(data.get('tdee', 0))
            if tdee <= 0:
                weight = float(data.get('weight', 70))
                height = float(data.get('height', 170))
                age = int(data.get('age', 30))
                gender = data.get('gender', 'M')
                
                activity_level_map = {
                    'sedentary': 1.2,
                    'lightly_active': 1.375,
                    'moderately_active': 1.55,
                    'very_active': 1.725,
                    'extra_active': 1.9
                }
                activity_level_str = data.get('activity_level', 'moderately_active')
                activity_level = activity_level_map.get(activity_level_str, 1.55)
                
                bmr = calculate_bmr(weight, height, age, gender)
                tdee = int(calculate_tdee(bmr, activity_level))
        except Exception as e:
            print(f"Error calculating TDEE: {e}, using default")
            tdee = 2000
            
        # Initialize meal planner and generate weekly plan
        planner = MealPlanner(
            breakfast_path='bf_final_updated_recipes_1.csv',
            lunch_path='lunch_final_updated_recipes_1.csv'
        )
        
        try:
            weekly_plan = planner.generate_weekly_plan(tdee, preferences)
        except ValueError as e:
            return jsonify({
                'error': str(e),
                'message': 'Unable to generate meal plan with current preferences. Please try with fewer dietary restrictions.'
            }), 400
        
        # Format plan with dates
        dated_weekly_plan = {}
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        today = datetime.now().date()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday)
        
        for i, day in enumerate(days_of_week):
            current_date = next_monday + timedelta(days=i)
            date_string = current_date.strftime('%Y-%m-%d')
            
            dated_weekly_plan[day] = {
                'date': date_string,
                'breakfast': weekly_plan[day]['Breakfast']['title'],
                'lunch': weekly_plan[day]['Lunch']['title'],
                'dinner': weekly_plan[day]['Dinner']['title'],
                'meals': {
                    'breakfast': {
                        'title': weekly_plan[day]['Breakfast']['title'],
                        'calories': convert_numpy_types(weekly_plan[day]['Breakfast']['calories']),
                        'servings': convert_numpy_types(weekly_plan[day]['Breakfast']['servings']),
                        'total_calories': convert_numpy_types(weekly_plan[day]['Breakfast']['total_calories'])
                    },
                    'lunch': {
                        'title': weekly_plan[day]['Lunch']['title'],
                        'calories': convert_numpy_types(weekly_plan[day]['Lunch']['calories']),
                        'servings': convert_numpy_types(weekly_plan[day]['Lunch']['servings']),
                        'total_calories': convert_numpy_types(weekly_plan[day]['Lunch']['total_calories'])
                    },
                    'dinner': {
                        'title': weekly_plan[day]['Dinner']['title'],
                        'calories': convert_numpy_types(weekly_plan[day]['Dinner']['calories']),
                        'servings': convert_numpy_types(weekly_plan[day]['Dinner']['servings']),
                        'total_calories': convert_numpy_types(weekly_plan[day]['Dinner']['total_calories'])
                    }
                }
            }
        
        return jsonify({'predicted_meal_plan': dated_weekly_plan})
        
    except Exception as e:
        print(f"Error in predict_meal_plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)