from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS to handle cross-origin requests

app = Flask(__name__)

# Enable CORS for all routes and all origins
CORS(app)

@app.route('/api/send-answer', methods=['POST', 'OPTIONS'])
def submit_answer():
    # Handle the preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response

    # Process the POST request
    data = request.get_json()  # Parse JSON data from the request
    if not data or 'answer' not in data:
        return jsonify({"error": "Invalid data"}), 400

    answer = data['answer']
    print(f"Received answer: {answer}")  # Log the received answer for debugging

    # Logic to determine the next question
    next_question = "Why do you like that color?" if "color" in answer.lower() else "What is your favorite hobby?"

    # Prompt the user for a new question in the terminal
    new_question = input("Enter a new question: ")

    # Respond with the new question
    return jsonify({"question": new_question or next_question})


if __name__ == '__main__':
    app.run(debug=True)



# from flask import Flask, request, jsonify
# from flask_cors import CORS  # Import CORS to handle cross-origin requests

# app = Flask(__name__)

# # Enable CORS for all routes and all origins
# CORS(app)

# @app.route('/api/send-answer', methods=['POST', 'OPTIONS'])
# def submit_answer():
#     # Handle the preflight OPTIONS request
#     if request.method == 'OPTIONS':
#         response = jsonify({})
#         response.headers.add('Access-Control-Allow-Origin', '*')
#         response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
#         response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
#         return response

#     # Process the POST request
#     data = request.get_json()  # Parse JSON data from the request
#     if not data or 'answer' not in data:
#         return jsonify({"error": "Invalid data"}), 400

#     answer = data['answer']
#     print(f"Received answer: {answer}")  # Log the received answer for debugging

#     # Logic to determine the next question
#     next_question = "Why do you like that color?" if "color" in answer.lower() else "What is your favorite hobby?"

#     # Respond with the next question
#     return jsonify({"question": next_question})

# if __name__ == '__main__':
#     app.run(debug=True)
