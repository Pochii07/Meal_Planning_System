from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from dataclasses import dataclass
import json
import os
from datetime import datetime, timedelta

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
        # Using standard numeric type for better clustering
        return np.array([[
            self.vegetarian, 
            self.low_purine, 
            self.low_fat,
            self.low_sodium, 
            self.lactose_free, 
            self.peanut_allergy,
            self.shellfish_allergy, 
            self.fish_allergy, 
            self.halal_or_kosher
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
        
        kmeans = KMeans(n_clusters=50, n_init='auto')
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
        
        # Track used meals to avoid repetition
        used_breakfast_titles = set()
        used_lunch_dinner_titles = set()
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for day in days:
            daily_meals = self._generate_daily_meals_with_variety(
                filtered_data, tdee, used_breakfast_titles, used_lunch_dinner_titles
            )
            
            # Update used meal tracking
            used_breakfast_titles.add(daily_meals['Breakfast']['title'])
            used_lunch_dinner_titles.add(daily_meals['Lunch']['title'])
            used_lunch_dinner_titles.add(daily_meals['Dinner']['title'])
            
            weekly_plan[day] = daily_meals

        return weekly_plan

    def _filter_by_preferences(self, preferences: DietaryPreferences) -> pd.DataFrame:
        # Using more efficient clustering-based preference filtering
        filtered_data = self.data.copy()
        pref_array = preferences.to_array()
        
        user_pref_scaled = self.scaler.transform(pref_array)
        user_cluster = self.kmeans_model.predict(user_pref_scaled)[0]
        
        cluster_mask = self.kmeans_model.labels_ == user_cluster
        return filtered_data[cluster_mask]

    def _generate_daily_meals_with_variety(
        self, filtered_data: pd.DataFrame, tdee: int, 
        used_breakfast_titles: set, used_lunch_dinner_titles: set
    ) -> Dict:
        """Generate daily meals with variety within a day and minimizing repetition across the week."""
        adjusted_tdee = tdee - 600  # Account for rice
        meal_calories = adjusted_tdee // 3
        calorie_margin = 50  # About 50 calories margin per meal

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
        
        # Try to avoid previously used breakfast meals
        new_breakfast_options = breakfast_options[~breakfast_options['title'].isin(used_breakfast_titles)]
        if not new_breakfast_options.empty:
            breakfast_options = new_breakfast_options
        
        # Try to avoid previously used lunch/dinner meals
        new_lunch_dinner_options = lunch_dinner_options[~lunch_dinner_options['title'].isin(used_lunch_dinner_titles)]
        if not new_lunch_dinner_options.empty and len(new_lunch_dinner_options) >= 2:
            lunch_dinner_options = new_lunch_dinner_options
            
        # Function to round to nearest allowed serving size
        def round_to_serving_size(serving):
            allowed_servings = [0.5, 1, 1.5, 2, 2.5, 3]
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

    def evaluate_meal_plan_recommendations(self, tdee: int, preferences: DietaryPreferences, n_trials: int = 100) -> Dict[str, float]:
        """
        Evaluate the meal planning system with more balanced success criteria.
        """
        total_trials = 0
        successful_trials = 0
        calorie_matches = 0
        preference_matches = 0
        
        # Adjusted calorie tolerances
        base_calories = tdee - 600  # Account for rice
        min_acceptable = base_calories - 150
        max_acceptable = base_calories + 150

        try:
            for _ in range(n_trials):
                try:
                    weekly_plan = self.generate_weekly_plan(tdee, preferences)
                    total_trials += 1
                    
                    # Track success metrics for this week
                    week_calorie_matches = 0
                    week_pref_matches = 0
                    
                    for day, meals in weekly_plan.items():
                        # Use total_calories instead of calories
                        daily_calories = sum(meal['total_calories'] for meal in meals.values())
                        
                        # Check each criterion independently
                        if min_acceptable <= daily_calories <= max_acceptable:
                            calorie_matches += 1
                            week_calorie_matches += 1
                            
                        if all(self._verify_meal_preferences(meal['title'], preferences) 
                              for meal in meals.values()):
                            preference_matches += 1
                            week_pref_matches += 1
                    
                    # A week is successful if it meets minimum thresholds
                    if (week_calorie_matches >= 5 and  # Allow 2 days of deviation
                        week_pref_matches == 7):       # Strict on preferences
                        successful_trials += 1
                        
                except Exception as e:
                    print(f"Trial failed: {str(e)}")
                    continue

            # Calculate metrics
            total_days = total_trials * 7
            accuracy = successful_trials / total_trials if total_trials > 0 else 0
            precision = calorie_matches / total_days if total_days > 0 else 0
            recall = preference_matches / total_days if total_days > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

            return {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1
            }

        except Exception as e:
            print(f"Evaluation error: {str(e)}")
            return {
                'accuracy': 0,
                'precision': 0,
                'recall': 0,
                'f1_score': 0
            }

    def _verify_meal_preferences(self, meal_title: str, preferences: DietaryPreferences) -> bool:
        """Verify if a meal matches the dietary preferences"""
        meal_data = self.data[self.data['title'] == meal_title].iloc[0]
        pref_array = preferences.to_array()[0]
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i] and not meal_data[column]:
                return False
        return True

# Define a route to predict meal plans
@app.route('/predict_meal_plan', methods=['POST'])
def predict_meal_plan():
    try:
        # Get parameters from request
        data = request.get_json()
        
        print(f"Received request data: {data}")
        
        # Extract dietary preferences from request format
        dietary_restrictions = data.get('dietary_restrictions', [])  # Could be either array or object
        allergies = data.get('allergies', [])
        
        # Debug output
        print(f"Dietary restrictions: {dietary_restrictions}")
        print(f"Allergies: {allergies}")
        
        # Handle different formats of dietary_restrictions (could be array, object, or string)
        if isinstance(dietary_restrictions, dict):
            # Handle dictionary format
            diet_list = [k for k, v in dietary_restrictions.items() if v]
        elif isinstance(dietary_restrictions, list):
            # Already a list
            diet_list = dietary_restrictions
        elif isinstance(dietary_restrictions, str):
            # Split string by commas if it's a string
            diet_list = [r.strip() for r in dietary_restrictions.split(',')]
        else:
            diet_list = []
            
        # Convert all to lowercase for case-insensitive matching
        diet_list = [d.lower() for d in diet_list if d]
        allergies = [a.lower() for a in allergies if a]
        
        # print(f"Processed diet list: {diet_list}")
        
        preferences = DietaryPreferences(
            vegetarian='vegetarian' in diet_list,
            low_purine='low purine' in diet_list or 'low-purine' in diet_list,
            low_fat='low fat' in diet_list or 'low-fat' in diet_list or 'heart healthy' in diet_list,
            low_sodium='low sodium' in diet_list or 'low-sodium' in diet_list,
            lactose_free='lactose free' in diet_list or 'lactose-free' in diet_list or 'lactose intolerant' in diet_list,
            peanut_allergy='peanut' in allergies,
            shellfish_allergy='shellfish' in allergies,
            fish_allergy='fish' in allergies,
            halal_or_kosher='halal' in diet_list or 'kosher' in diet_list
        )
        
        # print(f"Created preferences object: {preferences}")
        
        # Extract parameters for TDEE calculation
        try:
            # Try to get the direct TDEE value first
            tdee = int(data.get('tdee', 0))
            
            # If tdee is not provided, calculate it from other parameters
            if tdee <= 0:
                weight = float(data.get('weight', 70))  # Default 70kg
                height = float(data.get('height', 170))  # Default 170cm
                age = int(data.get('age', 30))  # Default 30 years
                gender = data.get('gender', 'M')  # Default Male
                
                # Map activity level string to multiplier value
                activity_level_map = {
                    'sedentary': 1.2,             # Little or no exercise
                    'lightly_active': 1.375,      # Light exercise 1-3 days/week
                    'moderately_active': 1.55,    # Moderate exercise 3-5 days/week
                    'very_active': 1.725,         # Hard exercise 6-7 days/week
                    'extra_active': 1.9           # Very hard exercise & physical job
                }
                activity_level_str = data.get('activity_level', 'moderately_active')
                activity_level = activity_level_map.get(activity_level_str, 1.55)
                
                # Calculate TDEE
                bmr = calculate_bmr(weight, height, age, gender)
                tdee = int(calculate_tdee(bmr, activity_level))
                print(f"Calculated TDEE: {tdee} (BMR: {bmr}, Activity Level: {activity_level})")
        except Exception as e:
            # Fall back to default TDEE if calculation fails
            print(f"Error calculating TDEE: {e}, using default")
            tdee = 2000
            
        print(f"Using TDEE: {tdee}")
        
        planner = MealPlanner(
            breakfast_path='bf_final_updated_recipes_1.csv',
            lunch_path='lunch_final_updated_recipes_1.csv'
        )
        
        try:
            # Generate plan with enhanced error handling
            weekly_plan = planner.generate_weekly_plan(tdee, preferences)
            print(f"Successfully generated weekly plan")
        except ValueError as e:
            print(f"Failed to generate plan: {e}")
            # Return a more helpful error message with status 400 instead of 500
            return jsonify({
                'error': str(e),
                'message': 'Unable to generate meal plan with current preferences. Please try with fewer dietary restrictions.'
            }), 400
        
        # Add dates to the meal plan
        dated_weekly_plan = {}
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        # Calculate next Monday for date assignment
        today = datetime.now().date()
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7  # If today is Monday, start from next Monday
        next_monday = today + timedelta(days=days_until_monday)
        
        for i, day in enumerate(days_of_week):
            current_date = next_monday + timedelta(days=i)
            date_string = current_date.strftime('%Y-%m-%d')
            
            # Format the meal data for frontend compatibility
            dated_weekly_plan[day] = {
                'date': date_string,
                'breakfast': weekly_plan[day]['Breakfast']['title'],
                'lunch': weekly_plan[day]['Lunch']['title'],
                'dinner': weekly_plan[day]['Dinner']['title'],
                'meals': {
                    'breakfast': {
                        'title': weekly_plan[day]['Breakfast']['title'],
                        'calories': weekly_plan[day]['Breakfast']['calories'],
                        'servings': weekly_plan[day]['Breakfast']['servings'],
                        'total_calories': weekly_plan[day]['Breakfast']['total_calories']
                    },
                    'lunch': {
                        'title': weekly_plan[day]['Lunch']['title'],
                        'calories': weekly_plan[day]['Lunch']['calories'],
                        'servings': weekly_plan[day]['Lunch']['servings'],
                        'total_calories': weekly_plan[day]['Lunch']['total_calories']
                    },
                    'dinner': {
                        'title': weekly_plan[day]['Dinner']['title'],
                        'calories': weekly_plan[day]['Dinner']['calories'],
                        'servings': weekly_plan[day]['Dinner']['servings'],
                        'total_calories': weekly_plan[day]['Dinner']['total_calories']
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
