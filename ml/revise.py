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
    def __init__(self, breakfast_path: str, lunch_path: str, sidedish_path: str, drink_path: str):
        self.breakfast_data_orig = pd.read_csv(breakfast_path)
        self.lunch_data_orig = pd.read_csv(lunch_path)
        self.sidedish_data_orig = pd.read_csv(sidedish_path)
        self.drink_data_orig = pd.read_csv(drink_path)
        
        self.breakfast_data_orig['category'] = 'breakfast'
        self.lunch_data_orig['category'] = 'lunch/dinner'
        self.sidedish_data_orig['category'] = 'sidedish'
        self.drink_data_orig['category'] = 'drink'

        self.dietary_columns = [
            'Vegetarian', 'Low-Purine', 'Low-fat/Heart-Healthy', 
            'Low-Sodium', 'Lactose-free', 'Peanut Allergy', 
            'Shellfish Allergy', 'Fish Allergy', 'Halal or Kosher'
        ]

        all_dfs = [self.breakfast_data_orig, self.lunch_data_orig, self.sidedish_data_orig, self.drink_data_orig]
        processed_dfs = []
        for df_orig in all_dfs:
            df = df_orig.copy()
            for col in self.dietary_columns:
                if col not in df.columns:
                    df[col] = False # Default to False if dietary column is missing
            
            if 'calories' not in df.columns:
                df['calories'] = 0
            else:
                df['calories'] = pd.to_numeric(df['calories'], errors='coerce').fillna(0)
            processed_dfs.append(df)
        
        self.data = pd.concat(processed_dfs, ignore_index=True)
        
        self.rf_model, self.kmeans_model, self.scaler = self._train_models()

    def _train_models(self) -> Tuple[RandomForestClassifier, KMeans, StandardScaler]:
        # Prepare data
        # Ensure 'calories' is numeric and handle potential NaNs from coercion or missing values
        self.data['calories'] = pd.to_numeric(self.data['calories'], errors='coerce').fillna(0)
        
        self.data['calorie_range'] = self._create_calorie_ranges(self.data['calories'])
        # Drop rows where 'calorie_range' could not be determined (e.g. if calories were NaN and became 0, then fell out of bins)
        # Or if 'calories' itself was critical and NaN.
        self.data = self.data.dropna(subset=['calories', 'calorie_range'])


        # Train Random Forest
        X = self.data[['calories']]
        y = self.data['calorie_range']
        # Ensure X and y are aligned after potential dropna
        valid_indices = X.index.intersection(y.index)
        X = X.loc[valid_indices]
        y = y.loc[valid_indices]

        if X.empty or y.empty:
            raise ValueError("Not enough data to train Random Forest model after preprocessing.")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        rf = RandomForestClassifier(n_estimators=50, random_state=42)
        rf.fit(X_train, y_train)

        # Train K-means
        # Ensure dietary columns exist and handle potential NaNs before scaling
        features_df = self.data[self.dietary_columns].copy()
        for col in self.dietary_columns: # Redundant if handled in __init__, but safe
            if col not in features_df.columns:
                features_df[col] = False
        features_df = features_df.fillna(False) # Fill any remaining NaNs in dietary columns with False

        features = features_df.values
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        kmeans = KMeans(n_clusters=min(22, len(np.unique(features_scaled, axis=0))), n_init='auto', random_state=42) # Adjust n_clusters if unique samples are less
        kmeans.fit(features_scaled)

        return rf, kmeans, scaler

    @staticmethod
    def _create_calorie_ranges(calories: pd.Series, tolerance: int = 30) -> pd.Series:
        max_calorie = int(calories.max()) + tolerance if not calories.empty else tolerance
        bins = list(range(0, max_calorie, tolerance))  # Convert float to int for range()
        if len(bins) < 2:  # Handle cases with very few calorie values
            bins = [0, max_calorie]
        labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)]
        if not labels:  # If only one bin, no labels can be generated by the loop
            return pd.Series(dtype='category')  # Return empty or a single category
        return pd.cut(calories, bins=bins, labels=labels, include_lowest=True)

    def generate_weekly_plan(self, tdee: int, preferences: DietaryPreferences) -> Dict:
        filtered_data = self._filter_by_preferences(preferences)
        weekly_plan = {}
        
        used_breakfast_titles = set()
        used_lunch_dinner_titles = set() # For main lunch/dinner items
        used_sidedish_titles = set()
        used_drink_titles = set()
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for day in days:
            daily_meals = self._generate_daily_meals_with_variety(
                filtered_data, tdee, 
                used_breakfast_titles, used_lunch_dinner_titles,
                used_sidedish_titles, used_drink_titles
            )
            
            # Add successfully chosen titles to the used sets for the next day
            if daily_meals['Breakfast']['title'] != 'None':
                used_breakfast_titles.add(daily_meals['Breakfast']['title'])
            
            if daily_meals['Lunch']['title'] != 'None':
                used_lunch_dinner_titles.add(daily_meals['Lunch']['title'])
            
            # Ensure dinner main item is added to used_lunch_dinner_titles
            # select_meal_component tries to pick unused from this set for the current day's dinner if possible
            if daily_meals['Dinner']['title'] != 'None':
                 # Add even if it's the same as lunch, the set handles uniqueness.
                 # The primary role of used_lunch_dinner_titles within _generate_daily_meals_with_variety
                 # is to attempt to make Lunch and Dinner different on the SAME day.
                 # Its role across days is managed here.
                used_lunch_dinner_titles.add(daily_meals['Dinner']['title'])

            # Add side dish and drink titles for each meal
            for meal_key_base in ['Breakfast', 'Lunch', 'Dinner']:
                side_key = f"{meal_key_base}_SideDish"
                if side_key in daily_meals and daily_meals[side_key]['title'] not in ['None', 'Water']:
                    used_sidedish_titles.add(daily_meals[side_key]['title'])
                
                drink_key = f"{meal_key_base}_Drink"
                if drink_key in daily_meals and daily_meals[drink_key]['title'] not in ['None', 'Water']:
                    used_drink_titles.add(daily_meals[drink_key]['title'])
            
            weekly_plan[day] = daily_meals

        return weekly_plan

    def _filter_by_preferences(self, preferences: DietaryPreferences) -> pd.DataFrame:
        filtered_data = self.data.copy()
        pref_array = preferences.to_array()[0]
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i]: # If this preference is active
                # For allergy, halal, kosher, it's a strict TRUE requirement
                if any(x in column.lower() for x in ['allergy', 'halal', 'kosher']):
                    filtered_data = filtered_data[filtered_data[column] == True]
                # For other preferences, also filter for TRUE
                elif column in ['Vegetarian', 'Low-Purine', 'Low-fat/Heart-Healthy', 'Low-Sodium', 'Lactose-free']:
                     filtered_data = filtered_data[filtered_data[column] == True]

        if filtered_data.empty:
            raise ValueError("Cannot find any meals matching your strict dietary requirements after initial filtering.")
            
        return filtered_data

    def _generate_daily_meals_with_variety(
        self, filtered_data: pd.DataFrame, tdee: int,
        used_breakfast_titles: set, used_lunch_dinner_titles: set,
        used_sidedish_titles: set, used_drink_titles: set
    ) -> Dict:

        RICE_CALORIES_PER_SERVING = 200
        
        rice_servings_bf = 1.0
        rice_servings_lunch = 1.0
        rice_servings_dinner = 1.0
        
        min_total_rice_calories = (rice_servings_bf + rice_servings_lunch + rice_servings_dinner) * RICE_CALORIES_PER_SERVING
        target_calories_for_other_items = max(0, tdee - min_total_rice_calories)
        
        bf_slot_target_cal = int(target_calories_for_other_items * 0.30)
        lunch_slot_target_cal = int(target_calories_for_other_items * 0.35)
        dinner_slot_target_cal = max(0, target_calories_for_other_items - bf_slot_target_cal - lunch_slot_target_cal)

        main_meal_calorie_margin = 50 
        side_drink_calorie_margin = 30 

        MAIN_VIAND_PROPORTION = 0.60 
        SIDE_DISH_PROPORTION = 0.20
        DRINK_PROPORTION = 0.20

        def _distribute_slot_calories(slot_cal, main_p, side_p, drink_p):
            main_target = int(slot_cal * main_p)
            side_target = int(slot_cal * side_p)
            drink_target = int(slot_cal * drink_p)
            current_sum = main_target + side_target + drink_target
            main_target += (slot_cal - current_sum)
            return max(0, main_target), max(0, side_target), max(0, drink_target)

        bf_main_target_cal, bf_side_target_cal, bf_drink_target_cal = _distribute_slot_calories(
            bf_slot_target_cal, MAIN_VIAND_PROPORTION, SIDE_DISH_PROPORTION, DRINK_PROPORTION
        )
        lunch_main_target_cal, lunch_side_target_cal, lunch_drink_target_cal = _distribute_slot_calories(
            lunch_slot_target_cal, MAIN_VIAND_PROPORTION, SIDE_DISH_PROPORTION, DRINK_PROPORTION
        )
        dinner_main_target_cal, dinner_side_target_cal, dinner_drink_target_cal = _distribute_slot_calories(
            dinner_slot_target_cal, MAIN_VIAND_PROPORTION, SIDE_DISH_PROPORTION, DRINK_PROPORTION
        )

        breakfast_options_all = filtered_data[filtered_data['category'] == 'breakfast']
        lunch_dinner_options_all = filtered_data[filtered_data['category'] == 'lunch/dinner']
        sidedish_options_all = filtered_data[filtered_data['category'] == 'sidedish']
        # Drinks that match current day's preferences
        drink_options_all_filtered = filtered_data[filtered_data['category'] == 'drink']
        # All drinks available in the system, ignoring current day's preferences (for fallback)
        all_system_drinks_df = self.data[self.data['category'] == 'drink']


        def select_meal_component(options_df, used_titles_set, target_cal, margin, component_name, is_main_meal=True):
            if options_df.empty:
                return {'title': 'None', 'calories': 0, 'servings': 1.0, 'total_calories': 0}

            component_options_filtered = pd.DataFrame()
            effective_target_cal = max(0, target_cal) 

            if effective_target_cal > 0:
                component_options_filtered = options_df[
                    (options_df['calories'] >= effective_target_cal - margin) &
                    (options_df['calories'] <= effective_target_cal + margin)
                ]
                if component_options_filtered.empty:
                    wider_margin_multiplier = 2.5 if not is_main_meal else 2 
                    component_options_filtered = options_df[
                        (options_df['calories'] >= effective_target_cal - (margin * wider_margin_multiplier)) &
                        (options_df['calories'] <= effective_target_cal + (margin * wider_margin_multiplier))
                    ]
                    if component_options_filtered.empty:
                        if effective_target_cal <= margin and not is_main_meal: 
                             component_options_filtered = options_df[options_df['calories'] <= margin * 1.5] 
                        if component_options_filtered.empty: # Fallback to all options if specific calorie matching fails
                            component_options_filtered = options_df 
            
            elif target_cal <= 0 and component_name in ["SideDish", "Drink"]: 
                zero_cal_options = options_df[options_df['calories'] == 0]
                if not zero_cal_options.empty:
                    component_options_filtered = zero_cal_options
                else: # If no zero calorie, try very low calorie
                    component_options_filtered = options_df[options_df['calories'] <= 20] 
                    if component_options_filtered.empty: # If still empty, return None to trigger fallback for drinks
                        return {'title': 'None', 'calories': 0, 'servings': 1.0, 'total_calories': 0}
            else: # Fallback to all options if other conditions don't specify a filter
                 component_options_filtered = options_df


            if component_options_filtered.empty: # Should be rare now with fallbacks above
                 return {'title': 'None', 'calories': 0, 'servings': 1.0, 'total_calories': 0}

            new_options = component_options_filtered[~component_options_filtered['title'].isin(used_titles_set)]
            options_to_sample_from = new_options if not new_options.empty else component_options_filtered
            
            if options_to_sample_from.empty: 
                 return {'title': 'None', 'calories': 0, 'servings': 1.0, 'total_calories': 0}

            options_to_sample_from = options_to_sample_from.copy()
            # For non-main meals with zero target cal, prefer lowest calorie. Otherwise, sort by diff.
            if effective_target_cal == 0 and not is_main_meal: 
                options_to_sample_from = options_to_sample_from.sort_values(by='calories').head(5)
            else:
                options_to_sample_from['abs_calorie_diff'] = (options_to_sample_from['calories'] - effective_target_cal).abs()
                options_to_sample_from = options_to_sample_from.sort_values(by=['abs_calorie_diff', 'calories']).head(5)

            if options_to_sample_from.empty: 
                return {'title': 'None', 'calories': 0, 'servings': 1.0, 'total_calories': 0}

            selected_item = options_to_sample_from.sample(n=1).iloc[0]
            
            servings = 1.0 
            if selected_item['calories'] > 0 and target_cal > 0: 
                if is_main_meal:
                    ideal_servings = target_cal / selected_item['calories']
                    allowed_servings = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0]
                    servings = min(allowed_servings, key=lambda x: abs(x - ideal_servings))
                    servings = max(0.5, min(servings, 3.0)) 
                elif component_name == "SideDish": 
                    ideal_servings = target_cal / selected_item['calories']
                    if abs(ideal_servings - 0.5) <= abs(ideal_servings - 1.0): servings = 0.5
                    else: servings = 1.0
            
            return {
                'title': selected_item['title'], 
                'calories': selected_item['calories'],
                'servings': servings,
                'total_calories': selected_item['calories'] * servings
            }

        def _get_fallback_drink(drinks_pref_filtered: pd.DataFrame, all_drinks_system: pd.DataFrame, current_used_titles: set):
            """
            Helper to select any drink, prioritizing non-"Water" and unused.
            Tries preference-filtered drinks first, then all system drinks.
            """
            
            def _sample_drink_from_df(df: pd.DataFrame, used_titles: set):
                if df.empty:
                    return None
                
                # Try unused options first
                options_unused = df[~df['title'].isin(used_titles)]
                if not options_unused.empty:
                    non_water_unused = options_unused[options_unused['title'] != 'Water']
                    if not non_water_unused.empty:
                        return non_water_unused.sample(n=1).iloc[0]
                    # If only "Water" is unused
                    water_unused = options_unused[options_unused['title'] == 'Water']
                    if not water_unused.empty:
                        return water_unused.sample(n=1).iloc[0]
                
                # If all options in df are used or no unused found, try any from df
                non_water_all = df[df['title'] != 'Water']
                if not non_water_all.empty:
                    return non_water_all.sample(n=1).iloc[0]
                
                water_all = df[df['title'] == 'Water'] # Pick "Water" if it's the only thing left in df
                if not water_all.empty:
                    return water_all.sample(n=1).iloc[0]
                
                return None # Should only happen if df was empty to begin with

            chosen_drink_row = _sample_drink_from_df(drinks_pref_filtered, current_used_titles)
            
            if chosen_drink_row is None: # If no drink from preference-filtered, try all system drinks
                chosen_drink_row = _sample_drink_from_df(all_drinks_system, current_used_titles)

            if chosen_drink_row is not None:
                return {
                    'title': chosen_drink_row['title'],
                    'calories': chosen_drink_row['calories'],
                    'servings': 1.0, 
                    'total_calories': chosen_drink_row['calories'] * 1.0
                }
            # Absolute last resort if all_drinks_system is also empty
            return {'title': 'None', 'calories': 0, 'servings': 1.0, 'total_calories': 0}


        # --- Select Breakfast Components ---
        breakfast_main = select_meal_component(
            breakfast_options_all, used_breakfast_titles,
            bf_main_target_cal, main_meal_calorie_margin, "Breakfast", is_main_meal=True
        )
        breakfast_side = select_meal_component(
            sidedish_options_all, used_sidedish_titles,
            bf_side_target_cal, side_drink_calorie_margin, "SideDish", is_main_meal=False
        )
        breakfast_drink = select_meal_component(
            drink_options_all_filtered, used_drink_titles, 
            bf_drink_target_cal, side_drink_calorie_margin, "Drink", is_main_meal=False
        )
        if breakfast_drink['title'] == 'None': # Fallback if no drink selected by calorie/preference
            breakfast_drink = _get_fallback_drink(drink_options_all_filtered, all_system_drinks_df, used_drink_titles)


        # --- Select Lunch Components ---
        temp_used_sidedish_titles = set(used_sidedish_titles)
        if breakfast_side['title'] != 'None': temp_used_sidedish_titles.add(breakfast_side['title'])
        
        temp_used_drink_titles = set(used_drink_titles) # Start with drinks used across days
        if breakfast_drink['title'] != 'None': temp_used_drink_titles.add(breakfast_drink['title']) # Add BF drink for today

        lunch_main = select_meal_component(
            lunch_dinner_options_all, used_lunch_dinner_titles, 
            lunch_main_target_cal, main_meal_calorie_margin, "Lunch", is_main_meal=True
        )
        lunch_side = select_meal_component(
            sidedish_options_all, temp_used_sidedish_titles, 
            lunch_side_target_cal, side_drink_calorie_margin, "SideDish", is_main_meal=False
        )
        lunch_drink = select_meal_component(
            drink_options_all_filtered, temp_used_drink_titles, 
            lunch_drink_target_cal, side_drink_calorie_margin, "Drink", is_main_meal=False
        )
        if lunch_drink['title'] == 'None':
            lunch_drink = _get_fallback_drink(drink_options_all_filtered, all_system_drinks_df, temp_used_drink_titles)


        # --- Select Dinner Components ---
        if lunch_side['title'] != 'None': temp_used_sidedish_titles.add(lunch_side['title'])
        if lunch_drink['title'] != 'None': temp_used_drink_titles.add(lunch_drink['title']) # Add Lunch drink for today

        current_day_lunch_dinner_used = set(used_lunch_dinner_titles) 
        if lunch_main['title'] != 'None': current_day_lunch_dinner_used.add(lunch_main['title']) 

        dinner_main = select_meal_component(
            lunch_dinner_options_all, current_day_lunch_dinner_used, 
            dinner_main_target_cal, main_meal_calorie_margin, "Dinner", is_main_meal=True
        )
        
        if dinner_main['title'] == lunch_main['title'] and lunch_main['title'] != 'None':
            already_used_main_lunch_dinner_plus_current_lunch = set(used_lunch_dinner_titles)
            if lunch_main['title'] != 'None': already_used_main_lunch_dinner_plus_current_lunch.add(lunch_main['title'])
            alternative_dinner_options = lunch_dinner_options_all[~lunch_dinner_options_all['title'].isin(already_used_main_lunch_dinner_plus_current_lunch)]
            if not alternative_dinner_options.empty:
                 dinner_alt_check = select_meal_component(alternative_dinner_options, set(), dinner_main_target_cal, main_meal_calorie_margin, "Dinner", is_main_meal=True)
                 if dinner_alt_check['title'] != 'None': dinner_main = dinner_alt_check
        
        dinner_side = select_meal_component(
            sidedish_options_all, temp_used_sidedish_titles, 
            dinner_side_target_cal, side_drink_calorie_margin, "SideDish", is_main_meal=False
        )
        dinner_drink = select_meal_component(
            drink_options_all_filtered, temp_used_drink_titles, 
            dinner_drink_target_cal, side_drink_calorie_margin, "Drink", is_main_meal=False
        )
        if dinner_drink['title'] == 'None':
            dinner_drink = _get_fallback_drink(drink_options_all_filtered, all_system_drinks_df, temp_used_drink_titles)

        # --- Calculate calories and adjust rice ---
        calories_from_selected_other_items = (
            breakfast_main['total_calories'] + breakfast_side['total_calories'] + breakfast_drink['total_calories'] +
            lunch_main['total_calories'] + lunch_side['total_calories'] + lunch_drink['total_calories'] +
            dinner_main['total_calories'] + dinner_side['total_calories'] + dinner_drink['total_calories']
        )
        current_day_total_calories_with_min_rice = calories_from_selected_other_items + min_total_rice_calories
        calorie_diff_from_tdee = tdee - current_day_total_calories_with_min_rice
        
        meals_for_rice_adjustment = ['Breakfast', 'Lunch', 'Dinner']
        rice_serving_threshold = RICE_CALORIES_PER_SERVING * 0.75

        for meal_name in meals_for_rice_adjustment:
            if calorie_diff_from_tdee >= rice_serving_threshold:
                if meal_name == 'Breakfast' and rice_servings_bf == 1.0:
                    rice_servings_bf = 2.0; calorie_diff_from_tdee -= RICE_CALORIES_PER_SERVING
                elif meal_name == 'Lunch' and rice_servings_lunch == 1.0:
                    rice_servings_lunch = 2.0; calorie_diff_from_tdee -= RICE_CALORIES_PER_SERVING
                elif meal_name == 'Dinner' and rice_servings_dinner == 1.0:
                    rice_servings_dinner = 2.0; calorie_diff_from_tdee -= RICE_CALORIES_PER_SERVING
            else: break
                
        total_rice_calories_bf = rice_servings_bf * RICE_CALORIES_PER_SERVING
        total_rice_calories_lunch = rice_servings_lunch * RICE_CALORIES_PER_SERVING
        total_rice_calories_dinner = rice_servings_dinner * RICE_CALORIES_PER_SERVING

        return {
            'Breakfast': breakfast_main,
            'Rice_Breakfast': {'title': 'Rice', 'calories': RICE_CALORIES_PER_SERVING, 'servings': rice_servings_bf, 'total_calories': total_rice_calories_bf},
            'Breakfast_SideDish': breakfast_side,
            'Breakfast_Drink': breakfast_drink,
            'Lunch': lunch_main,
            'Rice_Lunch': {'title': 'Rice', 'calories': RICE_CALORIES_PER_SERVING, 'servings': rice_servings_lunch, 'total_calories': total_rice_calories_lunch},
            'Lunch_SideDish': lunch_side,
            'Lunch_Drink': lunch_drink,
            'Dinner': dinner_main,
            'Rice_Dinner': {'title': 'Rice', 'calories': RICE_CALORIES_PER_SERVING, 'servings': rice_servings_dinner, 'total_calories': total_rice_calories_dinner},
            'Dinner_SideDish': dinner_side,
            'Dinner_Drink': dinner_drink,
        }

    def evaluate_meal_plan_recommendations(self, tdee: int, preferences: DietaryPreferences, n_trials: int = 10) -> Dict[str, float]:
        total_trials = 0
        successful_trials = 0
        calorie_matches = 0
        preference_matches = 0
        
        min_acceptable_daily_tdee = tdee - 150  # Target total daily calories around TDEE
        max_acceptable_daily_tdee = tdee + 150

        try:
            for _ in range(n_trials):
                try:
                    weekly_plan = self.generate_weekly_plan(tdee, preferences)
                    total_trials += 1
                    
                    week_calorie_matches = 0
                    week_pref_matches = 0
                    
                    for day, meals_dict in weekly_plan.items():
                        daily_actual_calories = sum(item_info['total_calories'] for item_info in meals_dict.values() if isinstance(item_info, dict) and 'total_calories' in item_info)
                        
                        # Check calorie criterion
                        if min_acceptable_daily_tdee <= daily_actual_calories <= max_acceptable_daily_tdee:
                            week_calorie_matches += 1
                            
                        # Check preference criterion
                        day_pref_ok = True
                        for meal_key, meal_info in meals_dict.items():
                            if isinstance(meal_info, dict) and 'title' in meal_info and \
                               meal_info['title'] not in ['Rice', 'None', 'Water']: # Don't check prefs for these
                                if not self._verify_meal_preferences(meal_info['title'], preferences):
                                    day_pref_ok = False
                                    break
                        if day_pref_ok:
                            week_pref_matches += 1
                    
                    calorie_matches += week_calorie_matches # total days with correct calories
                    preference_matches += week_pref_matches # total days meeting preferences

                    # A week is successful if most days meet calorie target and all days meet preferences
                    if (week_calorie_matches >= 5 and week_pref_matches == 7):
                        successful_trials += 1
                        
                except ValueError as e: # Catch errors from generate_weekly_plan (e.g. no meals found)
                    print(f"Trial failed during plan generation: {str(e)}")
                    continue
                except Exception as e:
                    print(f"Trial failed with unexpected error: {str(e)}")
                    continue

            total_days_generated = total_trials * 7
            accuracy = successful_trials / total_trials if total_trials > 0 else 0
            precision_cal = calorie_matches / total_days_generated if total_days_generated > 0 else 0
            recall_pref = preference_matches / total_days_generated if total_days_generated > 0 else 0
            
            print("\nDetailed Evaluation Metrics:")
            print("=" * 40)
            print(f"Total weekly plans attempted: {n_trials}")
            print(f"Total weekly plans successfully generated: {total_trials}")
            print(f"Acceptable daily calorie range (TDEE based): {min_acceptable_daily_tdee:.0f} - {max_acceptable_daily_tdee:.0f}")
            print(f"Total days with correct calories: {calorie_matches}/{total_days_generated if total_days_generated > 0 else 'N/A'}")
            print(f"Total days meeting preferences: {preference_matches}/{total_days_generated if total_days_generated > 0 else 'N/A'}")
            print(f"Successful weekly plans (>=5 days cal match & 7 days pref match): {successful_trials}/{total_trials if total_trials > 0 else 'N/A'}")
            print("-" * 40)

            return {
                'accuracy_weekly_success': accuracy, 
                'day_level_calorie_precision': precision_cal,
                'day_level_preference_recall': recall_pref, 
            }

        except Exception as e:
            print(f"Overall evaluation error: {str(e)}")
            return {
                'accuracy_weekly_success': 0,
                'day_level_calorie_precision': 0,
                'day_level_preference_recall': 0,
            }

    def _verify_meal_preferences(self, meal_title: str, preferences: DietaryPreferences) -> bool:
        if meal_title == 'None' or meal_title == 'Rice' or meal_title == 'Water': # Should not be checked
            return True 
        
        meal_data_rows = self.data[self.data['title'] == meal_title]
        if meal_data_rows.empty:
            print(f"Warning: Meal title '{meal_title}' not found in data for preference verification.")
            return False # Cannot verify, assume fails
        meal_data = meal_data_rows.iloc[0]
        
        pref_array = preferences.to_array()[0]
        
        for i, column in enumerate(self.dietary_columns):
            if pref_array[i]: # If this preference is True for the user
                if column not in meal_data or not meal_data[column]: # And the meal is False for this preference
                    return False
        return True

def main():
    planner = MealPlanner(
        breakfast_path='bf_revised.csv',
        lunch_path='lunch_revised.csv',
        sidedish_path='sidedish_recipes.csv', # Add path to your side dish CSV
        drink_path='drinks_recipes.csv'       # Add path to your drinks CSV
    )
    
    preferences = DietaryPreferences(
        vegetarian=True,
        peanut_allergy= True,
        shellfish_allergy= True,
        fish_allergy= True,
    )
    
    tdee = 3000 # Example TDEE
    
    try:
        weekly_plan = planner.generate_weekly_plan(tdee=tdee, preferences=preferences)
        
        print("\nWeekly Meal Plan:")
        print("=" * 80)
        
        for day, meals in weekly_plan.items():
            print(f"\n{day}:")
            print("-" * 40)
            daily_total_calories = 0
            
            for meal_type, meal_info in meals.items():
                if isinstance(meal_info, dict) and 'title' in meal_info: # Ensure it's a meal dict
                    print(f"{meal_type}:")
                    print(f"  - {meal_info['title']}")
                    if meal_info['title'] not in ['Rice', 'Water', 'None']: # Rice/Water/None don't have variable servings based on target
                        serving_text = "serving" if meal_info['servings'] == 1 else "servings"
                        print(f"  - {meal_info['servings']:.1f} {serving_text}")
                        print(f"  - Base Calories: {meal_info['calories']:.0f} per serving")
                    print(f"  - Total Calories: {meal_info['total_calories']:.0f}")
                    daily_total_calories += meal_info['total_calories']
                
            print(f"Daily Total Calories: {daily_total_calories:.0f} (Target TDEE: {tdee:.0f})")
            
    except ValueError as e:
        print(f"Error generating meal plan: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


    print("\nEvaluating Meal Planning System...")
    eval_tdee = 5000
    eval_preferences = DietaryPreferences(vegetarian=False) # Example: broader preferences for robust eval
    
    metrics = planner.evaluate_meal_plan_recommendations(tdee=eval_tdee, preferences=eval_preferences)
    
    print("\nOverall System Performance:")
    print("-" * 40)
    print(f"Weekly Success Accuracy: {metrics.get('accuracy_weekly_success', 0):.4f}")
    print(f"Day-Level Calorie Precision: {metrics.get('day_level_calorie_precision', 0):.4f}")
    print(f"Day-Level Preference Adherence: {metrics.get('day_level_preference_recall', 0):.4f}")

if __name__ == "__main__":
    main()