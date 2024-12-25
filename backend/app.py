from flask import Flask, jsonify, redirect, url_for, session, request
from flask_cors import CORS  # Import CORS to handle cross-origin requests

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Used for session management

# Enable CORS for all routes and all origins
CORS(app)

# Initialize a counter to track the number of questions
question_counter = {
    "count": 0,
    "questions": [
        "Your Roll no?"
    ]
}

@app.route('/start-test')
def start_test():
    session['completed'] = False  # Mark the user as not completed initially
    session.modified = True  # Make sure the session is marked as modified
    return jsonify({"message": "Test started!"})

@app.route('/complete-test')
def complete_test():
    session['completed'] = True  # Mark the user as completed
    session.modified = True  # Make sure the session is marked as modified
    return redirect(url_for('completion_page'))

@app.route('/completion-page', methods=['GET'])
def completion_page():
    # Check if the user has completed the test
    if not session.get('completed', False):  
        return redirect(url_for('home'))  # Redirect to home page if not completed
    return jsonify({"message": "Thank you for completing the test!"})

@app.route('/home')
def home():
    return jsonify({"message": "Welcome to the home page!"})

@app.route('/api/send-answer', methods=['POST', 'OPTIONS'])
def submit_answer():
    global question_counter

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

    # Check if we've reached the question limit
    if question_counter["count"] >= 11:
        # Redirect to a different page after 11 questions
        return jsonify({"redirect": True, "url": "/complete-test"})

    # Increment the counter and generate the next question
    question_counter["count"] += 1
    if question_counter["count"] == 1:
        next_question = question_counter["questions"][0]
    else:
        # Prompt for the next question in the terminal
        new_question = input("Enter a new question: ")
        if new_question.strip():
            question_counter["questions"].append(new_question)
        next_question = new_question or f"Question {question_counter['count']}?"

    # Respond with the next question
    return jsonify({"question": next_question})

if __name__ == '__main__':
    app.run(debug=True)