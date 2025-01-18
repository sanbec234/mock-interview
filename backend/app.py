from flask import Flask, jsonify, redirect, url_for, session, request
from flask_cors import CORS  # Import CORS to handle cross-origin requests
from pymongo import MongoClient
from datetime import datetime

from question import get_least_asked_questions
from evaluation import calculate_cosine_similarity, calculate_keyword_score, check_grammar, check_relevance, check_introduction_relevance,append_evaluation_to_file
import pymysql

# Database connection details
timeout = 10
p="AVNS_XzZH4-okIadBScgtxaI"
connection = pymysql.connect(
    charset="utf8mb4",
    connect_timeout=timeout,
    cursorclass=pymysql.cursors.DictCursor,
    db="Jasss",  # Replace with your actual database name
    host="mysql-390a28f4-javagarm-bf62.c.aivencloud.com",  # Replace with your actual host
    password=p,  # Replace with your actual password
    read_timeout=timeout,
    port=12629,  # Replace with your actual port if needed
    user="avnadmin",  # Replace with your actual user
    write_timeout=timeout,
)
cursor = connection.cursor()

app = Flask(__name__)
import os
app.secret_key = os.getenv('SECRET_KEY', 'fallback-key')
mongo_client = MongoClient("mongodb+srv://21z221:0000@cluster0.i0qha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = mongo_client["test_results_db"]  # Replace with your database name
collection = db["test_results"]       
  # Make sure to use a secret key for session management
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
count = 0
easy_no = 50
tot_no=200
medium_no = 100
hard_no = 150
diff = "Easy"
ans = ""
ques = ""
key = ""
api=""
diffculty = {
    "Easy": 1,
    "Medium": 2,
    "Hard": 3
}
# Enable CORS for all routes and all origins
CORS(app)
mark = 0
total = 0

# Initialize a counter to track the number of questions
question_counter = {
    "count": 0,
    "questions": [
        "Your Roll no?"
    ]
}

# New data structure to store answers, reference answers, and scores
user_data = {
    "answers": [],
    "reference_answers": [],
    "questions": [],
    "scores": []
}
@app.route('/api/submit', methods=['POST'])
def submit_data():
    global tot_no,easy_no,medium_no,api
    try:
        # Get JSON data from the request body
        data = request.get_json()

        # Extract the data fields from the request
        num_questions = data.get('numQuestions')
        api_url = data.get('apiUrl')
        selected_topics = data.get('selectedTopics')
        tot_no=num_questions
        easy_no=num_questions*0.4
        medium_no=num_questions*0.7
        api=api_url

        

        # Here you can process and store the data (e.g., save to database or file)
        # For now, we'll just print it to the console
        print(f"Received data: numQuestions={num_questions}, apiUrl={api_url}, selectedTopics={selected_topics}")

        # Respond back with a success message
        return jsonify({"redirect": True, "url": "/home"})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'message': 'Failed to submit data'}), 500

@app.route('/api/topics', methods=['GET'])
def get_topics():
    cursor.execute("SELECT DISTINCT subject FROM question_bank")
    result = cursor.fetchall()

    # Collect distinct subjects into a list
    topics = [row['subject'] for row in result]
    
    return jsonify({"topics": topics})   

@app.route('/start-test')
def start_test():
    session['completed'] = False  # Mark the user as not completed initially
    session.modified = True  # Make sure the session is marked as modified
    # Reset the user data at the start of the test
    user_data['answers'] = []
    user_data['reference_answers'] = []
    user_data['questions'] = []
    user_data['scores'] = []
    return jsonify({"message": "Test started!"})

@app.route('/complete-test')
def complete_test():
    session['completed'] = True  # Mark the user as completed
    session.modified = True  # Make sure the session is marked as modified
    return redirect(url_for('completion_page'))

@app.route('/completion-page', methods=['GET'])
def completion_page():
    mark = 0
    evaluations = []
    global api

    print("------- Test Completion -------")
    gra = check_grammar(user_data["answers"][0])
    gra = round(float(gra) if isinstance(gra, (int, float)) else 0.0, 2)
    llm, expl = check_introduction_relevance(user_data["answers"][0],api)
    llm = round(float(llm) if isinstance(llm, (int, float)) else 0.0, 2)
    expl = expl if isinstance(expl, str) else "No explanation provided."
    avg_score = round((gra * 0.3 + llm * 0.7) / 5, 2)
    evaluations.append({
        "question": "introduce yourself",
        "reference_answer": """
    Frontend Developer role requiring skills in React, JavaScript, HTML, CSS, 
    and experience with REST APIs. The ideal candidate should have a strong understanding 
    of responsive design, cross-browser compatibility, and state management tools like Redux. 
    Preferred skills include knowledge of TypeScript, CI/CD pipelines, and cloud services.
    """,
        "user_answer": user_data["answers"][0],
        "grammar_score": gra,
        "cosine_similarity_score": 0,
        "keyword_score": 0,
        "llm_relevance_score": llm,
        "total_score": avg_score,
        "explanation": expl
    })
    if avg_score < 0:
        avg_score = 0
    mark += avg_score

    # Iterate over each question and calculate the scores
    for idx in range(1, len(user_data["questions"])):
        question = user_data["questions"][idx]
        reference_answer = user_data["reference_answers"][idx]
        user_answer = user_data["answers"][idx]

        cos = calculate_cosine_similarity(reference_answer, user_answer)
        cos = round(float(cos) if isinstance(cos, (int, float)) else 0.0, 2)
        
        keyscore, common_keywords = calculate_keyword_score(user_answer, reference_answer)
        keyscore = round(float(keyscore) if isinstance(keyscore, (int, float)) else 0.0, 2)
        
        gra = check_grammar(user_answer)
        gra = round(float(gra) if isinstance(gra, (int, float)) else 0.0, 2)
        
        llm, expl = check_relevance(question, reference_answer, user_answer,api)
        llm = round(float(llm) if isinstance(llm, (int, float)) else 0.0, 2)
        expl = expl if isinstance(expl, str) else "No explanation provided."

        avg_score = round((cos * 0.15 + keyscore * 0.2 + gra * 0.15 + llm * 0.5) / 5, 2)
        
        if avg_score < 0:
            avg_score = 0
        mark += avg_score

        evaluations.append({
            "question": question,
            "reference_answer": reference_answer,
            "user_answer": user_answer,
            "grammar_score": gra,
            "cosine_similarity_score": cos,
            "keyword_score": keyscore,
            "llm_relevance_score": llm,
            "total_score": avg_score,
            "explanation": expl
        })


    append_evaluation_to_file(evaluations, mark)

    final_score = round((mark / len(user_data["questions"])) * 100, 2)
    print("\nTotal Test Score: {}%".format(final_score))

    try:
        result_data = {  # Replace with actual user ID
            "test_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "final_score": final_score,
            "evaluations": evaluations
        }
        collection.insert_one(result_data)
        print("Results successfully uploaded to MongoDB.")
    except Exception as e:
        print("Error uploading results to MongoDB: {}".format(e))

    
    return jsonify({
        "message": "Score: {}".format(final_score),
        "final_score": final_score,
        "evaluations": evaluations
    })



@app.route('/home')
def home():
    return jsonify({"message": "Welcome to the home page!"})

@app.route('/api/send-answer', methods=['POST', 'OPTIONS'])
def submit_answer():
    global count, diff, mark, ans, ques, key, total, question_counter,tot_no

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
    print("Received answer: {}".format(answer))  # Log the received answer for debugging
 # Log the received answer for debugging

    # Store the current answer, question, and reference answer
    user_data['answers'].append(answer)
    user_data['questions'].append(ques)
    user_data['reference_answers'].append(ans)

    # Check if we've reached the question limit
    if question_counter["count"] >= tot_no:
        print("2")
        return jsonify({"redirect": True, "url": "/complete-test"})

    # Increment the counter and generate the next question
    question_counter["count"] += 1
        
    print(mark, count, total, question_counter["count"])

    if count == easy_no:
        diff = "Medium"
    if count == medium_no:
        diff = "Hard"
    
    # Fetch new questions for the next round
    new_questions = get_least_asked_questions(diff)
    count += 1
    print(new_questions)
    ans = ','.join(new_questions["Answer"])
    ques = ','.join(new_questions["Question"])
    key = ','.join(new_questions["Keyword"])

    # Respond with the new question
    return jsonify({"question": ', '.join(new_questions["Question"])})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '')
    password = data.get('password', '')
    print(email,password)

    # Log the received email and password
    print("Email: {}".format(email))
    print("Password: {}".format(password))


    # Example validation (replace with your own logic)
    if email == 'test@example.com' and password == 'password123':
        session['user'] = {
            'email': email,
            'role': 'admin'  # You can dynamically set user role or other details
        }
        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
