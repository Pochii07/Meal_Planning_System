from flask import Flask, request, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# Initialize the Flask app
app = Flask(__name__)

# Load the dataset
df = pd.read_csv('ml/Reduced_Dataset.csv')

# Update column names to match the code requirements
df.rename(columns={
    'weight(kg)': 'Weight',
    'height(m)': 'Height',
    'age': 'Age',
    'gender': 'Gender',
    'Dietary restriction': 'Dietary Restrictions',
    'activity_level': 'Activity Level'
}, inplace=True)

# Replace NaN in 'Allergies' and 'Dietary Restrictions' with 'None'
df['Allergies'] = df['Allergies'].fillna('None')
df['Dietary Restrictions'] = df['Dietary Restrictions'].fillna('None')

# Preprocess the data: Convert categorical columns to numerical values using LabelEncoder
label_encoders = {}
for column in ['Gender', 'Dietary Restrictions', 'Allergies', 'Activity Level']:
    le = LabelEncoder()
    df[column] = df[column].astype(str)  # Ensure all values are strings
    le.fit(df[column].unique().tolist() + ['None'])  # Include 'None' in the fitting process
    df[column] = le.transform(df[column])
    label_encoders[column] = le

# Split the data into training and testing sets
X = df[['Weight', 'Height', 'Age', 'Gender', 'Dietary Restrictions', 'Allergies', 'Activity Level']]
y = df['Meal Plan']  # Assuming 'Meal Plan' is the target variable
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest Classifier
model = RandomForestClassifier(n_estimators=5, random_state=42)
model.fit(X_train, y_train)

# Define a route to predict meal plans
@app.route('/predict_meal_plan', methods=['POST'])
def predict_meal_plan():
    try:
        # Parse the JSON request data
        data = request.json
        
        # Extract and encode input data
        user_input = pd.DataFrame({
            'Weight': [data['weight']],
            'Height': [data['height']],
            'Age': [data['age']],
            'Gender': [label_encoders['Gender'].transform([data['gender']])[0]],
            'Dietary Restrictions': [label_encoders['Dietary Restrictions'].transform([data['dietary_restrictions']])[0]],
            'Allergies': [label_encoders['Allergies'].transform([data['allergies']])[0]],
            'Activity Level': [label_encoders['Activity Level'].transform([data['activity_level']])[0]]
        })

        # Debugging: Print the user input
        print("User Input:", user_input)

        # Make a prediction
        predicted_class = model.predict(user_input)

        # Debugging: Print the prediction
        print("Prediction:", predicted_class)

        # Return the result as JSON
        return jsonify({'predicted_meal_plan': predicted_class[0]})
    except Exception as e:
        # Debugging: Print the error
        print("Error:", str(e))
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
