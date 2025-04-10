import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
from sklearn.model_selection import train_test_split

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
        
        kmeans = KMeans(n_clusters=50, n_init='auto', random_state=42)
        kmeans.fit(features_scaled)

        return rf, kmeans, scaler

    @staticmethod
    def _create_calorie_ranges(calories: pd.Series, tolerance: int = 30) -> pd.Series:
        bins = list(range(0, 2501, tolerance))
        labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)]
        return pd.cut(calories, bins=bins, labels=labels)

    def generate_weekly_plan(self, tdee: int, preferences: DietaryPreferences) -> Dict:
        if tdee < 1200:
            raise ValueError("TDEE must be at least 1200 calories")

        filtered_data = self._filter_by_preferences(preferences)
        weekly_plan = {}
        
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            daily_meals = self._generate_daily_meals(filtered_data, tdee)
            weekly_plan[day] = daily_meals

        return weekly_plan

    def _filter_by_preferences(self, preferences: DietaryPreferences) -> pd.DataFrame:
        filtered_data = self.data.copy()
        pref_array = preferences.to_array()
        
        user_pref_scaled = self.scaler.transform(pref_array)
        user_cluster = self.kmeans_model.predict(user_pref_scaled)[0]
        
        cluster_mask = self.kmeans_model.labels_ == user_cluster
        return filtered_data[cluster_mask]

    def _generate_daily_meals(self, filtered_data: pd.DataFrame, tdee: int) -> Dict:
        """Generate daily meals ensuring breakfast and lunch/dinner come from appropriate datasets."""
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

        # Sample meals from appropriate datasets
        breakfast = breakfast_options.sample(n=1).iloc[0]
        lunch = lunch_dinner_options.sample(n=1).iloc[0]
        dinner = lunch_dinner_options.sample(n=1).iloc[0]

        return {
            'Breakfast': {'title': breakfast['title'], 'calories': breakfast['calories']},
            'Lunch': {'title': lunch['title'], 'calories': lunch['calories']},
            'Dinner': {'title': dinner['title'], 'calories': dinner['calories']}
        }

    def evaluate_meal_plan_recommendations(self, tdee: int, preferences: DietaryPreferences, n_trials: int = 100) -> Dict[str, float]:
        """
        Evaluate the meal planning system with more balanced success criteria.
        """
        total_trials = 0
        successful_trials = 0
        calorie_matches = 0
        variety_matches = 0
        preference_matches = 0
        
        # Adjusted calorie tolerances
        base_calories = tdee - 600  # Account for rice
        min_acceptable = base_calories * 0.8 
        max_acceptable = base_calories * 1.1  

        try:
            for _ in range(n_trials):
                try:
                    weekly_plan = self.generate_weekly_plan(tdee, preferences)
                    total_trials += 1
                    
                    # Track success metrics for this week
                    week_calorie_matches = 0
                    week_variety_matches = 0
                    week_pref_matches = 0
                    
                    for day, meals in weekly_plan.items():
                        daily_calories = sum(meal['calories'] for meal in meals.values())
                        meal_titles = [meal['title'] for meal in meals.values()]
                        
                        # Check each criterion independently
                        if min_acceptable <= daily_calories <= max_acceptable:
                            calorie_matches += 1
                            week_calorie_matches += 1
                            
                        if len(set(meal_titles)) == len(meal_titles):
                            variety_matches += 1
                            week_variety_matches += 1
                            
                        if all(self._verify_meal_preferences(meal['title'], preferences) 
                              for meal in meals.values()):
                            preference_matches += 1
                            week_pref_matches += 1
                    
                    # A week is successful if it meets minimum thresholds
                    if (week_calorie_matches >= 5 and  # Allow 2 days of deviation
                        week_variety_matches >= 5 and  # Allow 2 days of repetition
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

    def _verify_meal_preferences(self, meal_title: str, preferences: DietaryPreferences) -> bool:
        """Verify if a meal matches the dietary preferences"""
        meal_data = self.data[self.data['title'] == meal_title].iloc[0]
        pref_array = preferences.to_array()[0]
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i] and not meal_data[column]:
                return False
        return True

def main():
    planner = MealPlanner(
        breakfast_path='new model/combined_bf_recipes.csv',
        lunch_path='new model/combined_lunch_recipes.csv'
    )
    
    preferences = DietaryPreferences(
        vegetarian=True,
        # low_purine =True,
        # low_fat = True,
        # low_sodium= True,
        # lactose_free= True,
        # peanut_allergy= True,
        # shellfish_allergy= True,
        # fish_allergy= True,
        # halal_or_kosher= True

    )
    
    try:
        weekly_plan = planner.generate_weekly_plan(tdee=2000, preferences=preferences)
        
        print("\nWeekly Meal Plan:")
        print("=" * 80)
        
        for day, meals in weekly_plan.items():
            print(f"\n{day}:")
            print("-" * 40)
            daily_total = 0
            
            for meal_type, meal_info in meals.items():
                print(f"{meal_type}:")
                print(f"  - {meal_info['title']}")
                print(f"  - Calories: {meal_info['calories']:.0f}")
                daily_total += meal_info['calories']
                
            print(f"Daily Total Calories: {daily_total:.0f}")
            
    except ValueError as e:
        print(f"Error: {e}")

    # Evaluate the entire system
    print("\nEvaluating Meal Planning System...")
    metrics = planner.evaluate_meal_plan_recommendations(tdee=2000, preferences=preferences)
    
    print("\nOverall System Performance:")
    print("-" * 40)
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1_score']:.4f}")

if __name__ == "__main__":
    main()
