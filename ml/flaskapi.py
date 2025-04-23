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

# Initialize the Flask app
app = Flask(__name__)
# Enable CORS for your frontend origin
CORS(app, resources={
    r"/*": {  # Allow all routes
        "origins": [
            "http://localhost:5173",  # Vite dev server
            "http://localhost:3000",  # Optional: React dev server
            "http://127.0.0.1:5173"   # Alternative local URL
        ],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True  # Important for cookies/auth
    }
})

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
            int(self.vegetarian),
            int(self.low_purine),
            int(self.low_fat),
            int(self.low_sodium),
            int(self.lactose_free),
            int(self.peanut_allergy),
            int(self.shellfish_allergy),
            int(self.fish_allergy),
            int(self.halal_or_kosher)
        ]])

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
        
        kmeans = KMeans(n_clusters=50, n_init='auto', random_state=42)
        kmeans.fit(features_scaled)

        return rf, kmeans, scaler

    @staticmethod
    def _create_calorie_ranges(calories: pd.Series, tolerance: int = 30) -> pd.Series:
        bins = list(range(0, 2501, tolerance))
        labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)]
        return pd.cut(calories, bins=bins, labels=labels)

    def generate_weekly_plan(self, tdee: int, preferences: DietaryPreferences) -> Dict:
        """Generate a weekly meal plan with improved variety."""
        if tdee < 1200:
            raise ValueError("TDEE must be at least 1200 calories")

        filtered_data = self._filter_by_preferences(preferences)
        weekly_plan = {}
        
        # Track used meals to avoid repetition
        used_breakfast_titles = set()
        used_lunch_dinner_titles = set()
        
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            daily_meals = self._generate_daily_meals_with_variety(
                filtered_data, tdee, used_breakfast_titles, used_lunch_dinner_titles
            )
            
            # Track used titles for variety
            used_breakfast_titles.add(daily_meals['breakfast'])
            used_lunch_dinner_titles.add(daily_meals['lunch'])
            used_lunch_dinner_titles.add(daily_meals['dinner'])
            
            weekly_plan[day] = daily_meals

        return weekly_plan

    def _filter_by_preferences(self, preferences: DietaryPreferences) -> pd.DataFrame:
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
        adjusted_tdee = tdee - 600
        meal_calories = adjusted_tdee // 3
        # Allow 20% deviation from target calories
        calorie_margin = meal_calories * 0.2

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

        # Filter out previously used meals if possible
        unique_breakfast_options = breakfast_options[~breakfast_options['title'].isin(used_breakfast_titles)]
        if not unique_breakfast_options.empty:
            breakfast_options = unique_breakfast_options
            
        unique_lunch_dinner_options = lunch_dinner_options[~lunch_dinner_options['title'].isin(used_lunch_dinner_titles)]
        if not unique_lunch_dinner_options.empty:
            lunch_dinner_options = unique_lunch_dinner_options

        # Sample different meals for breakfast, lunch, and dinner
        breakfast = breakfast_options.sample(n=1).iloc[0]
        
        # For lunch and dinner, ensure they're different from each other
        lunch = lunch_dinner_options.sample(n=1).iloc[0]
        dinner_options = lunch_dinner_options[lunch_dinner_options['title'] != lunch['title']]
        
        # If no different dinner options available, use original options
        if dinner_options.empty:
            dinner = lunch_dinner_options.sample(n=1).iloc[0]
        else:
            dinner = dinner_options.sample(n=1).iloc[0]

        return {
            'breakfast': breakfast['title'],
            'lunch': lunch['title'],
            'dinner': dinner['title']
        }

    def _verify_meal_preferences(self, meal_title: str, preferences: DietaryPreferences) -> bool:
        """Verify if a meal matches the dietary preferences"""
        meal_data = self.data[self.data['title'] == meal_title].iloc[0]
        pref_array = preferences.to_array()[0]
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i] and not meal_data[column]:
                return False
        return True

    def evaluate_meal_plan_recommendations(self, tdee: int, preferences: DietaryPreferences, n_trials: int = 100) -> Dict[str, float]:
        """
        Evaluate the meal planning system with more balanced success criteria.
        """
        try:
            total_trials = 0
            successful_trials = 0
            total_days = 0
            calorie_matches = 0
            variety_matches = 0
            preference_matches = 0
            
            min_acceptable = tdee * 0.90
            max_acceptable = tdee * 1.10
            
            tp, tn, fp, fn = 0, 0, 0, 0
            
            for _ in range(n_trials):
                total_trials += 1
                trial_success = True
                
                try:
                    weekly_plan = self.generate_weekly_plan(tdee, preferences)
                    
                    for day, meals in weekly_plan.items():
                        total_days += 1
                        
                        # Check meal variety within the day
                        day_meals = [meals['breakfast'], meals['lunch'], meals['dinner']]
                        if len(set(day_meals)) == len(day_meals):
                            variety_matches += 1
                        else:
                            trial_success = False
                        
                        # Check preferences
                        day_pref_match = all(self._verify_meal_preferences(meal, preferences) for meal in day_meals)
                        if day_pref_match:
                            preference_matches += 1
                        else:
                            trial_success = False
                            
                        for meal_type, meal_title in meals.items():
                            meets_preferences = self._verify_meal_preferences(meal_title, preferences)
                            
                            if meets_preferences:
                                tp += 1  # Meal matches preferences
                            else:
                                fp += 1  # Meal doesn't match preferences
                                
                    if trial_success:
                        successful_trials += 1
                except Exception:
                    fn += 1  # Failed to generate a plan that should have been possible
            
            # Calculate metrics
            accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

            print("\nDetailed Evaluation Metrics:")
            print("=" * 40)
            print(f"Total weekly plans generated: {total_trials}")
            print(f"Acceptable calorie range: {min_acceptable:.0f} - {max_acceptable:.0f}")
            print(f"Days with correct calories: {calorie_matches}/{total_days}")
            print(f"Days with meal variety: {variety_matches}/{total_days}")
            print(f"Days meeting preferences: {preference_matches}/{total_days}")
            print(f"Successful weekly plans: {successful_trials}/{total_trials}")
            print("-" * 40)
            
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

# Initialize the meal planner
planner = MealPlanner(
    breakfast_path='bf.csv',
    lunch_path='lunch.csv'
)

# Define a route to predict meal plans
@app.route('/predict_meal_plan', methods=['POST'])
def predict_meal_plan():
    try:
        # Parse the JSON request data
        data = request.json
        
        # Extract necessary inputs for the meal planner
        age = float(data.get('age', 30))
        height = float(data.get('height', 170))
        weight = float(data.get('weight', 70))
        gender = data.get('gender', 'Male')
        activity_level = data.get('activity_level', 'Moderate')
        
        # Calculate TDEE (Total Daily Energy Expenditure) based on inputs
        bmr = 0
        if gender.lower() == 'male':
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
            
        # Activity multiplier
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very active': 1.9
        }
        multiplier = activity_multipliers.get(activity_level.lower(), 1.55)
        tdee = int(bmr * multiplier)
        
        # Parse dietary preferences
        dietary_restrictions = data.get('dietary_restrictions', '').lower()
        allergies = data.get('allergies', '').lower()
        
        # Create dietary preferences object
        preferences = DietaryPreferences(
            vegetarian='vegetarian' in dietary_restrictions,
            low_purine='low purine' in dietary_restrictions,
            low_fat='low fat' in dietary_restrictions or 'heart healthy' in dietary_restrictions,
            low_sodium='low sodium' in dietary_restrictions,
            lactose_free='lactose free' in dietary_restrictions or 'lactose intolerant' in dietary_restrictions,
            peanut_allergy='peanut' in allergies,
            shellfish_allergy='shellfish' in allergies,
            fish_allergy='fish' in allergies,
            halal_or_kosher='halal' in dietary_restrictions or 'kosher' in dietary_restrictions
        )
        
        # Generate weekly meal plan
        weekly_plan = planner.generate_weekly_plan(tdee, preferences)
        
        # Return the result directly as JSON (no double encoding)
        return jsonify({'predicted_meal_plan': weekly_plan})
    except Exception as e:
        # Debugging: Print the error
        print(f"Error: {str(e)}")
        print(f"Request data: {request.json}")
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
