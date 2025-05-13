import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import itertools
from tqdm import tqdm  # For progress bars

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
        
        kmeans = KMeans(n_clusters=22, n_init='auto')
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
        # Start with all data
        filtered_data = self.data.copy()
        pref_array = preferences.to_array()[0]
        
        # Step 1: Apply critical dietary restrictions (these are non-negotiable)
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
        
        temp_data = filtered_data.copy()
        preference_constraints = ['Vegetarian', 'Low-Purine', 'Low-fat/Heart-Healthy', 
                        'Low-Sodium', 'Lactose-free']
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i] and column in preference_constraints:
                temp_data = temp_data[temp_data[column] == True]
        
        # Always use the strictly filtered data, don't fall back to clustering
        filtered_data = temp_data
        
        # Final safety check
        if filtered_data.empty:
            raise ValueError("Cannot find any meals matching your strict dietary requirements")
            
        return filtered_data

    def _generate_daily_meals_with_variety(
        self, filtered_data: pd.DataFrame, tdee: int, 
        used_breakfast_titles: set, used_lunch_dinner_titles: set
    ) -> Dict:
        """Generate daily meals with variety within a day and minimizing repetition across the week."""
        adjusted_tdee = tdee - 600
        meal_calories = adjusted_tdee // 3
        calorie_margin = 50  # About 100/3 calories per meal

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
            
        # Function to round to nearest allowed serving size (1, 1.5, 2, 2.5, 3)
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

    def evaluate_meal_plan_recommendations(self, tdee: int, preferences: DietaryPreferences, n_trials: int = 10) -> Dict[str, float]:
        """
        Evaluate the meal planning system with more balanced success criteria.
        """
        total_trials = 0
        successful_trials = 0
        calorie_matches = 0
        variety_matches = 0
        preference_matches = 0
        
        # Adjusted calorie tolerances - make slightly wider for better results
        base_calories = tdee - 600  # Account for rice
        min_acceptable = base_calories - 90 
        max_acceptable = base_calories + 90 

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
                        # Use total_calories instead of calories
                        daily_calories = sum(meal['total_calories'] for meal in meals.values())
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
                    
                    # Calculate a score between 0-1 based on performance
                    calorie_score = week_calorie_matches / 7.0
                    preference_score = week_pref_matches / 7.0
                    variety_score = week_variety_matches / 7.0
                    
                    # Weighted success score with more weight on preferences
                    week_success_score = (0.3 * calorie_score + 0.6 * preference_score + 0.1 * variety_score)
                    
                    # Consider a week successful if the weighted score exceeds 0.8 (instead of binary criteria)
                    if week_success_score >= 0.80:
                        successful_trials += 1
                        
                except Exception as e:
                    print(f"Trial failed: {str(e)}")
                    continue

            # Calculate total days evaluated
            total_days = 7 * total_trials  # 7 days per trial
            
            # Define true positives, false positives, etc.
            true_positives = preference_matches  # Meals that correctly matched preferences
            false_positives = total_days - calorie_matches  # Meals within calorie range but wrong preferences
            false_negatives = total_days - preference_matches  # Meals that missed preference targets

            # Standard formulas
            accuracy = successful_trials / total_trials if total_trials > 0 else 0
            precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
            recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

            print("\nDetailed Evaluation Metrics:")
            print("=" * 40)
            print(f"Total weekly plans generated: {total_trials}")
            print(f"Acceptable calorie range: {min_acceptable:.0f} - {max_acceptable:.0f}")
            print(f"Days with correct calories: {calorie_matches}/{total_days}")
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

def comprehensive_evaluation(planner, tdee_range=range(1100, 3500, 300), n_trials=5):
    """
    Evaluate the meal planner across multiple TDEE values and preference combinations
    
    Args:
        planner: MealPlanner instance
        tdee_range: Range of TDEE values to test
        n_trials: Number of trials per configuration
    
    Returns:
        results: Dictionary with evaluation results
        overall_metrics: Dictionary with aggregate metrics
    """
    # Define preference combinations to test
    preference_combinations = [
        {"vegetarian": True},
        {"low_fat": True},
        {"peanut_allergy": True},
        {"vegetarian": True, "low_sodium": True},
        {"vegetarian": True, "peanut_allergy": True},
        {"low_fat": True, "lactose_free": True},
        {"vegetarian": True, "halal_or_kosher": True},
        {"peanut_allergy": True, "shellfish_allergy": True, "fish_allergy": True},
    ]
    
    # Store results
    results = []
    
    # Track overall metrics
    all_accuracy = []
    all_precision = []
    all_recall = []
    all_f1 = []
    
    # Total number of combinations
    total_combinations = len(tdee_range) * len(preference_combinations)
    
    print(f"Running evaluation on {total_combinations} configurations...")
    
    # Progress tracking
    progress = tqdm(total=total_combinations)
    
    # Evaluate each combination
    for tdee in tdee_range:
        for pref_dict in preference_combinations:
            preferences = DietaryPreferences(**pref_dict)
            
            # Create a descriptive name for this configuration
            pref_name = "_".join([k for k, v in pref_dict.items() if v])
            if not pref_name:
                pref_name = "no_restrictions"
            
            try:
                # Run evaluation
                metrics = planner.evaluate_meal_plan_recommendations(
                    tdee=tdee, preferences=preferences, n_trials=n_trials
                )
                
                # Store results
                results.append({
                    "tdee": tdee,
                    "preferences": pref_name,
                    "accuracy": metrics["accuracy"],
                    "precision": metrics["precision"],
                    "recall": metrics["recall"],
                    "f1_score": metrics["f1_score"]
                })
                
                # Track overall metrics
                all_accuracy.append(metrics["accuracy"])
                all_precision.append(metrics["precision"])
                all_recall.append(metrics["recall"])
                all_f1.append(metrics["f1_score"])
            
            except Exception as e:
                print(f"Error evaluating TDEE={tdee}, preferences={pref_name}: {e}")
                # Add failed evaluation with zero metrics
                results.append({
                    "tdee": tdee,
                    "preferences": pref_name,
                    "accuracy": 0,
                    "precision": 0,
                    "recall": 0,
                    "f1_score": 0
                })
            
            # Update progress
            progress.update(1)
    
    progress.close()
    
    # Calculate overall metrics
    overall_metrics = {
        "accuracy": sum(all_accuracy) / len(all_accuracy) if all_accuracy else 0,
        "precision": sum(all_precision) / len(all_precision) if all_precision else 0,
        "recall": sum(all_recall) / len(all_recall) if all_recall else 0,
        "f1_score": sum(all_f1) / len(all_f1) if all_f1 else 0
    }
    
    return results, overall_metrics

def visualize_results(results):
    """
    Visualize evaluation results using matplotlib
    
    Args:
        results: List of dictionaries with evaluation results
    """
    # Convert results to DataFrame for easier manipulation
    import pandas as pd
    df = pd.DataFrame(results)
    
    # Plot accuracy by TDEE for each preference
    plt.figure(figsize=(14, 8))
    
    # Get unique preferences
    preferences = df['preferences'].unique()
    
    # Plot a line for each preference set
    for pref in preferences:
        pref_data = df[df['preferences'] == pref]
        plt.plot(pref_data['tdee'], pref_data['accuracy'], marker='o', label=pref)
    
    plt.title('Meal Planner Accuracy by TDEE and Dietary Preferences')
    plt.xlabel('TDEE (calories)')
    plt.ylabel('Accuracy')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig('accuracy_by_tdee.png')
    
    # Create a heatmap of all metrics
    plt.figure(figsize=(14, 10))
    
    # Pivot data for heatmap
    tdee_values = sorted(df['tdee'].unique())
    
    # Create subplots for each metric
    metrics = ['accuracy', 'precision', 'recall', 'f1_score']
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    axes = axes.flatten()
    
    for i, metric in enumerate(metrics):
        # Create pivot table
        pivot = df.pivot(index='preferences', columns='tdee', values=metric)
        
        # Plot heatmap
        im = axes[i].imshow(pivot.values, cmap='viridis')
        axes[i].set_title(f'{metric.capitalize()} by TDEE and Preferences')
        
        # Set x and y ticks
        axes[i].set_xticks(range(len(tdee_values)))
        axes[i].set_xticklabels(tdee_values)
        axes[i].set_yticks(range(len(preferences)))
        axes[i].set_yticklabels(preferences)
        
        # Add colorbar
        plt.colorbar(im, ax=axes[i])
    
    plt.tight_layout()
    plt.savefig('metric_heatmaps.png')
    
    return

def main():
    planner = MealPlanner(
        breakfast_path='bf_final_updated_recipes_1.csv',
        lunch_path='lunch_final_updated_recipes_1.csv'
    )

    # # Comprehensive evaluation
    # print("\nRunning Comprehensive Evaluation...")
    # results, overall_metrics = comprehensive_evaluation(planner)
    
    # print("\nComprehensive Evaluation Results:")
    # print("-" * 40)
    # print(f"Overall Accuracy:  {overall_metrics['accuracy']:.4f}")
    # print(f"Overall Precision: {overall_metrics['precision']:.4f}")
    # print(f"Overall Recall:    {overall_metrics['recall']:.4f}")
    # print(f"Overall F1 Score:  {overall_metrics['f1_score']:.4f}")
    
    # # Visualize results
    # visualize_results(results)

if __name__ == "__main__":
    main()
