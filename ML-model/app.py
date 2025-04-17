from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import numpy as np
import os
import pickle
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)


# Load ML model and scalers
model = pickle.load(open('model.pkl', 'rb'))
scaler = pickle.load(open('standscaler.pkl', 'rb'))
minmax_scaler = pickle.load(open('minmaxscaler.pkl', 'rb'))

# MongoDB setup
client = MongoClient(os.getenv("DB_URL")) # Replace with your MongoDB URI if using Atlas
db = client['krishimart']
collection = db['predictions']

# Crop labels dictionary
crop_dict = {
    1: "Rice", 2: "Maize", 3: "Jute", 4: "Cotton", 5: "Coconut",
    6: "Papaya", 7: "Orange", 8: "Apple", 9: "Muskmelon", 10: "Watermelon",
    11: "Grapes", 12: "Mango", 13: "Banana", 14: "Pomegranate", 15: "Lentil",
    16: "Blackgram", 17: "Mungbean", 18: "Mothbeans", 19: "Pigeonpeas",
    20: "Kidneybeans", 21: "Chickpea", 22: "Coffee"
}

# Prediction route
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        features = [
            data['Nitrogen'],
            data['Phosphorus'],
            data['Potassium'],
            data['Temperature'],
            data['Humidity'],
            data['Ph'],
            data['Rainfall']
        ]

        # Preprocessing
        input_array = np.array(features).reshape(1, -1)
        scaled_input = minmax_scaler.transform(input_array)
        final_input = scaler.transform(scaled_input)

        # Model prediction
        prediction = model.predict(final_input)[0]
        crop_name = crop_dict.get(prediction, "Unknown")

        # Store data in MongoDB
        collection.insert_one({
            "input": {
                "Nitrogen": data['Nitrogen'],
                "Phosphorus": data['Phosphorus'],
                "Potassium": data['Potassium'],
                "Temperature": data['Temperature'],
                "Humidity": data['Humidity'],
                "Ph": data['Ph'],
                "Rainfall": data['Rainfall']
            },
            "prediction": crop_name
        })

        return jsonify({
            "success": True,
            "predicted_crop": crop_name,
            "message": f"{crop_name} is the best crop to be cultivated right there."
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# Run app
if __name__ == '__main__':
    app.run(debug=True)
