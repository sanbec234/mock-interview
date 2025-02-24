from flask import Flask, request, jsonify,send_file
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
import mysql.connector
from flask_cors import CORS
import json
import evaluation 
import io
import csv
from groq import Groq 
import pandas as pd


app = Flask(__name__)
app.secret_key = 'your_secret_key' 
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
  # Enable CORS with credentials
# CORS(app)

# Database connection timeout and parameters
timeout = 10
connection = pymysql.connect(
  charset="utf8mb4",
  connect_timeout=timeout,
  cursorclass=pymysql.cursors.DictCursor,
  db="Jasss",
  host="mysql-390a28f4-javagarm-bf62.c.aivencloud.com",
  password="AVNS_XzZH4-okIadBScgtxaI",
  read_timeout=timeout,
  port=12629,
  user="avnadmin",
  write_timeout=timeout,
)

# Database connection
def get_db_connection():
    return pymysql.connect(
        charset="utf8mb4",
        connect_timeout=timeout,
        cursorclass=pymysql.cursors.DictCursor,
        db="Jasss",
        host="mysql-390a28f4-javagarm-bf62.c.aivencloud.com",
        password="AVNS_XzZH4-okIadBScgtxaI",
        read_timeout=timeout,
        port=12629,
        user="avnadmin",
        write_timeout=timeout,
    )

conn = get_db_connection()

# Create User Endpoint
@app.route('/create_user', methods=['POST'])
def create_user():
    data = request.json
    try:
        cursor = conn.cursor()

        hashed_password = generate_password_hash(data['password'])
        sql = """INSERT INTO user (rollno, name, email, password, department, year, cgpa,college) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s,%s)"""
        values = (data['rollno'], data['name'], data['email'], hashed_password, data['department'], data['year'], data['cgpa'],data['college'])
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()

# Login User Endpoint
@app.route('/login_user', methods=['POST'])
def login_user():
    data = request.json
    try:
        cursor = conn.cursor()

        # Check if userType is 'admin'
        if data['userType'] == 'admin':
            if data['email'] == 'admin@gmail.com' and data['password'] == 'jasss':
                print("Login Success - admin")
                return jsonify({'message': 'Admin login successful', 'user': 'admin'}), 200
            else:
                return jsonify({'error': 'Invalid admin credentials'}), 401
        else:
            # Handle normal user login
            cursor.execute("SELECT * FROM user WHERE email = %s", (data['email'],))
            user = cursor.fetchone()
            if user and check_password_hash(user['password'], data['password']):
                print("Login Success - Student")
                return jsonify({'message': 'Login successful', 'user': user["email"]}), 200
            else:
                return jsonify({'error': 'Invalid user credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()# Start Test Endpoint

@app.route('/start_test', methods=['POST'])
def start_test():
    try:
        data = request.get_json()
        print("-------------------------")
        print(data)

        # Extract data from the request
        email = data.get('email')
        apiURL = data.get('apiUrl')
        topics = data.get('selectedTopics')
        # topics = [{'topic': 'Operating Systems', 'difficulty': 'hard'}, 
        # {'topic': 'Data Structures and Algorithms', 'difficulty': 'medium'}
        # , {'topic': 'Computer Networks', 'difficulty': 'medium'}]
        num_questions = 3

        # Validate input data
        if not email or not num_questions or not topics:
            return jsonify({'message': 'Invalid input data'}), 400
        
        # Fetch roll number for the given email
        cursor = conn.cursor()
        cursor.execute("SELECT rollno FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'User not found'}), 404

        roll_no = user['rollno']

        # Fetch questions based on topic and difficulty level
        question_ids = []
        for topic_data in topics:
            topic = topic_data.get('topic')
            print(topic_data)
            difficulty = topic_data.get('difficulty')

            if not topic or not difficulty:
                continue  # Skip invalid data

            cursor.execute(
                "SELECT id FROM question_bank WHERE subject = %s AND difficulty_level = %s ORDER BY id LIMIT %s",
                (topic, difficulty, num_questions),
            )
            fetched_questions = cursor.fetchall()

            # Collect question IDs
            print(fetched_questions)
            question_ids.extend([q['id'] for q in fetched_questions])

        if not question_ids:
            return jsonify({'message': 'No questions found for the selected topics and difficulty'}), 400

        # Convert list of question IDs into a comma-separated string
        question_ids_str = ','.join(map(str, question_ids))
        print("---------------151----------")


        # Insert a new test record into the database
        sql = "INSERT INTO test (rollno, question_indices) VALUES (%s, %s)"
        values = (roll_no, question_ids_str)
        cursor.execute(sql, values)
        test_id = cursor.lastrowid
        conn.commit()

        # Fetch the actual questions
        cursor.execute(
            f"SELECT id, question FROM question_bank WHERE id IN ({question_ids_str})"
        )
        questions = cursor.fetchall()

        questions_list = [
            {'id': question['id'], 'question': question['question']}
            for question in questions
        ]
        print("---------------171----------")
        print({
            'message': 'New test created',
            'questions': questions_list,
            'test_id': test_id
        })


        # Return response with test and questions data
        return jsonify({
            'message': 'New test created',
            'questions': questions_list,
            'test_id': test_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()


def create_question_indices(num_questions, selected_topics):
    questions_indices = []

    for i in range(len(selected_topics)):
        subject = selected_topics[i]
        to_ask = 0

        if i == len(selected_topics) - 1:
            to_ask = num_questions - len(questions_indices)
        else:
          to_ask = num_questions / len(selected_topics)

        try:
            cursor = conn.cursor()
            call_procedure = f"CALL GetQuestionsBySubjects({to_ask}, '{subject}')"
            cursor.execute(call_procedure)

            # Fetch the results
            results = cursor.fetchall()
            for row in results:
                questions_indices.append(row['id'])
            cursor.close()
        except Exception as e:
            pass
        finally:
            cursor.close()
    return questions_indices



# --------------------------------- Above code completed ------------------ \




# @app.route('/resultlist', methods=['POST'])#-------------------------------postman pass
# {
#   "rollno": "22i434"
# }
# {
#     "incomplete_tests": [
#         1,
#         2,
#         3,
#         4,
#         5,
#         6,
#         7,
#         8,
#         11
#     ],
#     "tests_with_pending_results": [
#         9,
#         12
#     ],
#     "tests_with_results": [
#         10
#     ]
# }

@app.route('/resultlist', methods=['POST'])
def resultlist():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400
        
        roll_no = data.get('rollno')
        roll_no="21z111"
        if not roll_no:
            return jsonify({"error": "Missing rollno"}), 400
        
        # Call stored procedure
        cursor = conn.cursor()
        if cursor:
            print("True")
        cursor.execute("CALL GetTestResults(%s)", (roll_no,))
        result = cursor.fetchone()
        
        if result is None:
            return jsonify({"error": "No results found for the given rollno"}), 404

        # Check for unexpected output
        if result == (0, 0, 0):
            return jsonify({"error": "Unexpected result returned from stored procedure"}), 500
        result=result["""JSON_OBJECT('incomplete_tests', incomplete_tests,\n                       'tests_with_pending_results', tests_with_pending_results,\n                       'tests_with_results', tests_with_results)"""]
        # Format the result
        result_dict = json.loads(result)
        formatted_result = {
        "incomplete_tests": result_dict.get("incomplete_tests", []),
        "tests_with_pending_results": result_dict.get("tests_with_pending_results", []),
        "tests_with_results": result_dict.get("tests_with_results", []),
        }

        return jsonify(formatted_result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400

    finally:
        if 'cursor' in locals():
            cursor.close()

@app.route('/submit_answers', methods=['POST'])#--------------------postman pass
#{
#     "rollno": "21i434",
#     "testid": 4,
#     "answers": [
#         {"id": 1, "answer": "This is the answer for Q1"},
#         {"id": 2, "answer": "This is the answer for Q2"}
#     ]
# }

def submit_answers():
    # Get JSON data from the request
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON data"}), 400

    # Extract fields from the JSON payload
    roll_no = data.get('rollno')
    test_id = data.get('testid')
    answers = data.get('answers')

    if not roll_no or not test_id or not answers:
        return jsonify({"error": "Missing required fields"}), 400

    # Validate that answers is a list
    if not isinstance(answers, list):
        return jsonify({"error": "'answers' should be a list of dictionaries"}), 400

    # Connect to the MySQL database
    try:
        cursor = conn.cursor()

        # Prepare the SQL statement (replace column names with actual table columns)
        sql = """
        INSERT INTO history ( test_id, question, answer)
        VALUES ( %s, %s, %s)
        ON DUPLICATE KEY UPDATE answer= VALUES(answer)
        """

        # Insert each answer into the table
        for ans in answers:
            question_id = ans.get('id')
            answer_text = ans.get('answer')

            if question_id is None or answer_text is None:
                continue  # Skip invalid entries

            cursor.execute(sql, ( test_id, question_id, answer_text))
        update_query = "UPDATE test SET iscompleted = 1 WHERE test_id = %s"
        cursor.execute(update_query, (test_id,))
        # Commit the transaction
        conn.commit()

        return jsonify({"message": "Answers submitted successfully"}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Database error occurred"}), 500

    finally:
        # Close the cursor
        if cursor:
            cursor.close()

            

@app.route('/upload', methods=['POST'])
def upload_csv():
    try:
        data = request.json.get('data')
        print("Data received from frontend:", data)  # Debugging: Check what data is being received
        
        if not data or not isinstance(data, list):
            return jsonify({"message": "Invalid data format"}), 400

        max_keyword_length = 1024  # Adjust based on your database column size

        sanitized_data = []
        for item in data:
            if not item.get('Question') or not item.get('Answer') or not item.get('Keyword') or not item.get('Subject') or not item.get('Subtopic') or not item.get('Difficultylevel'):
                return jsonify({"message": "Data Invalid: Required fields are missing"}), 400

            keyword = item['Keyword'][:max_keyword_length] if len(item['Keyword']) > max_keyword_length else item['Keyword']

            sanitized_data.append((
                item['Question'],
                item['Answer'],
                keyword,
                item.get('Difficultylevel'),
                item['Subject'],
                item['Subtopic'],
                item.get('count', 0)
            ))

        # Debug: Print the sanitized data to ensure correctness
        print("Sanitized data to insert:", sanitized_data)

        # Assuming you have a valid DB connection here
        cursor = conn.cursor()

        # Check the number of columns in your table and match with the data structure
        insert_query = """
        INSERT INTO question_bank (question, answer, keyword, difficulty_level, subject, subtopic, count)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            answer = VALUES(answer),
            keyword = VALUES(keyword),
            difficulty_level = VALUES(difficulty_level),
            subject = VALUES(subject),
            subtopic = VALUES(subtopic),
            count = VALUES(count)
        """
        
        cursor.executemany(insert_query, sanitized_data)
        conn.commit()
        cursor.close()

        return jsonify({"message": "Data inserted successfully", "rows": len(sanitized_data)}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"message": "Server error", "error": str(e)}), 500

@app.route('/delete', methods=['DELETE'])  # Ensure DELETE method is used
def delete():
    try:
        # Connect to the database
        cursor = conn.cursor()

        # Execute the delete query
        cursor.execute("DELETE FROM question_bank WHERE 1=1")  # Deletes all records from the 'question' table
        
        # Commit the transaction
        conn.commit()

        # Close the connection
        cursor.close()

        return jsonify({"message": "All data deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"message": "Server error", "error": str(e)}), 500
    
@app.route('/download_csv', methods=['GET'])
def download_csv():
    if conn is None:
        return jsonify({"message": "Database connection failed."}), 500
    try:
        # Database connection (adjust for your database)
        
        cursor = conn.cursor()

        # Query to select all data from the history table
        cursor.execute("SELECT * FROM history")
        
        rows = cursor.fetchall()
        
        rows = [
            [
                field if field is not None else ""  # Replace None with empty string
                for field in row.values()  # row.values() ensures we're using the actual data
            ]
            for row in rows
        ]
        print(rows)
        # Get column names
        column_names = [i[0] for i in cursor.description]

        # Create an in-memory buffer to hold the CSV data
        output = io.StringIO()  # Use StringIO for text mode
        csv_writer = csv.writer(output)

        # Write the header (column names)
        csv_writer.writerow(column_names)

        # Write the data
        csv_writer.writerows(rows)

        # Reset the buffer's position to the start before sending it
        output.seek(0)

        # Ensure the response is not prematurely closed
        response = send_file(
            output,
            as_attachment=True,
            download_name="history_data.csv",
            mimetype="text/csv"
        )

        # Keep the connection open until the response is fully sent
        response.cache_control.no_store = True
        response.direct_passthrough = True
        return response
    except Exception as e:
        print(f"Error occurred: {str(e)}")

        return jsonify({"message": "Server error", "error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/records', methods=['GET'])
def get_data():
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM question_bank")
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        cursor.close()

@app.route('/api/records/<int:id>', methods=['PUT'])
def update_data(id):
    data = request.json
    try:
        cursor = conn.cursor()
        sql = """
            UPDATE question_bank 
            SET question = %s, answer = %s, keyword = %s, difficulty_level = %s, 
                subject = %s, subtopic = %s, count = %s
            WHERE id = %s
        """
        cursor.execute(sql, (
            data['question'], data['answer'], data['keyword'], data['difficulty_level'],
            data['subject'], data['subtopic'], data['count'], id
        ))
        conn.commit()
        return jsonify({'message': 'Data updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        cursor.close()

@app.route('/api/records/<int:id>', methods=['DELETE'])
def delete_record(id):
    try:
        cursor = conn.cursor()
        sql = "DELETE FROM question_bank WHERE id = %s"
        cursor.execute(sql, (id,))
        conn.commit()
        return jsonify({'message': 'Record deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        cursor.close()

# Add a new record
@app.route('/api/records', methods=['POST'])
def add_record():
    data = request.json
    required_fields = ['question', 'answer', 'keyword', 'difficulty_level', 'subject', 'subtopic']

    # Check for missing required fields
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({'error': f"The following fields are required and cannot be empty: {', '.join(missing_fields)}"}), 400

    try:
        cursor = conn.cursor()
        sql = """
            INSERT INTO question_bank (question, answer, keyword, difficulty_level, subject, subtopic, count)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data['question'], 
            data['answer'], 
            data['keyword'], 
            data['difficulty_level'], 
            data['subject'], 
            data['subtopic'], 
            data.get('count', 0)  # Default count to 0 if not provided
        ))
        conn.commit()
        return jsonify({'message': 'Record added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()


@app.route('/api/records/filter', methods=['GET'])
def filter_data():
    field = request.args.get('field')
    value = request.args.get('value')
    try:
        cursor = conn.cursor()
        sql = f"SELECT * FROM question_bank WHERE LOWER({field}) LIKE LOWER(%s)"
        cursor.execute(sql, (f"%{value}%",))
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        cursor.close()

@app.route('/resume', methods=['POST'])
def resume_test():
    data = request.get_json()
    test_id = data.get('testId')
    print(f"Resume Test ID: {test_id}")
    # Perform the desired action for resuming the test
    return jsonify({"message": f"Test {test_id} resumed successfully!"})

# Function to get overall feedback for a test_id
def get_overall_feedback(df, test_id, api_key):
    client = Groq(api_key=api_key)

    # Filter the data for the given test_id
    test_data = df[df["test_id"] == test_id]

    # Combine all feedback into a single text block
    all_feedback = "\n".join(test_data["feedback"].tolist())

    # Construct the LLM prompt
    prompt = f"""
    You are an AI evaluator. Summarize the feedback provided for a student's test answers.
    Identify key strengths, areas for improvement, and actionable recommendations.

    Feedback from the evaluation:
    {all_feedback}

    Provide a structured summary with:
    1. **Overall Performance Summary**
    2. **Areas for Improvement**
    3. **Actionable Recommendations**

    Ensure the summary is concise and professional.
    """

    # Call the Groq API
    completion = client.chat.completions.create(
        model="llama3-8b-8192",  # Using Llama 3 model
        messages=[{"role": "system", "content": "You are a helpful evaluator."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=300
    )

    return completion.choices[0].message.content


@app.route('/check_result', methods=['POST'])
def checkresult():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400

        test_id = data.get('testId')
        api_key = "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"
        
        if not test_id:
            return jsonify({"error": "Missing test ID"}), 400

        result = []
        cursor = conn.cursor()

        # Query the history table
        cursor.execute("SELECT * FROM history WHERE test_id = %s", (test_id,))
        rows = cursor.fetchall()
        print("Rows fetched from history:", rows)  # Debugging log

        if not rows:
            print(f"No history found for test_id: {test_id}")
            return jsonify({"error": "No data found for the given test ID"}), 404

        for row in rows:
            qid = row.get('question')
            if not qid:
                print(f"Invalid QID in row: {row}")
                continue

            # Query the question table
            cursor.execute("SELECT question, answer, keyword FROM question_bank WHERE id = %s", (qid,))
            question_data = cursor.fetchone()

            if question_data:
                result.append({
                    "qid": qid,
                    "test_id": row['test_id'],
                    "question": question_data['question'],
                    "reference_answer": question_data['answer'],
                    "answer": row['answer'],
                    "keyword": question_data['keyword']
                })

        # List to store feedback
        feedback_list = []

        for question in result:
            similarity_score = evaluation.calculate_cosine_similarity(question['reference_answer'], question['answer'])
            grammar_check = evaluation.check_grammar(question['answer'])
            llm_score, reason = evaluation.check_relevance(question['question'], question['reference_answer'], question['answer'], api_key)
            keywords_score, _ = evaluation.calculate_keyword_score(question['answer'], question['keyword'].split(", "))

            feedback_list.append(reason)

            sql = """
                UPDATE history
                SET similarity_score = %s, keyword_matching = %s, grammar_check = %s, llm_score = %s, feedback = %s
                WHERE test_id = %s AND question = %s
            """
            values = (
                str(similarity_score),
                str(keywords_score),
                str(grammar_check),
                str(llm_score),
                reason,
                str(question['test_id']),
                str(question['qid'])
            )
            cursor.execute(sql, values)

        # Convert to DataFrame for LLM evaluation
        df = pd.DataFrame(result)
        df["feedback"] = feedback_list

        # Get overall feedback
        overall_feedback = get_overall_feedback(df, test_id, api_key)

        # Store overall feedback in the test table
        update_query = "UPDATE test SET isresult = 1, overall_feedback = %s WHERE test_id = %s"
        cursor.execute(update_query, (overall_feedback, test_id))

        conn.commit()
        return jsonify([{"message": "Evaluation completed and data saved successfully", "overall_feedback": overall_feedback}]), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()


@app.route('/api/topics', methods=['GET'])
def get_topics():
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT subject FROM question_bank")
    result = cursor.fetchall()

    # Collect distinct subjects into a list
    topics = [row['subject'] for row in result]
    cursor.close()
    return jsonify({"topics": topics})
  
@app.route('/view_result', methods=['POST'])
def viewresult():
    try:
        # Get JSON data from the request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400

        # Extract test ID from the request
        test_id = data.get('testid')
        if not test_id:
            return jsonify({"error": "Missing test ID"}), 400

        cursor = conn.cursor()

        # Fetch the results from the history table for the given test_id
        cursor.execute("""
            SELECT 
                h.test_id, h.question, h.answer AS user_answer, 
                COALESCE(h.similarity_score, 0) AS similarity_score,
                COALESCE(h.keyword_matching, 0) AS keyword_score,
                COALESCE(h.grammar_check, 0) AS grammar_score,
                COALESCE(h.llm_score, 0) AS llm_relevance_score,
                COALESCE(h.feedback, '') AS feedback
            FROM history h
            WHERE h.test_id = %s
        """, (test_id,))
        history_rows = cursor.fetchall()

        if not history_rows:
            return jsonify({"error": "No results found for the given test ID"}), 404

        evaluations = []
        total_score = 0

        # Replace the question ID with the actual question text and reference answer
        for row in history_rows:
            question_id = row["question"]
            user_answer = row["user_answer"]
            similarity_score = row["similarity_score"]
            keyword_score = row["keyword_score"]
            grammar_score = row["grammar_score"]
            llm_relevance_score = row["llm_relevance_score"]
            feedback = row["feedback"]

            # Fetch question and reference answer
            cursor.execute(
                "SELECT question, answer, subject, subtopic, difficulty_level FROM question_bank WHERE id = %s", 
                (question_id,)
            )
            question_data = cursor.fetchone()

            if question_data:
                question = question_data["question"]
                reference_answer = question_data["answer"]
                difficulty = question_data["difficulty_level"]
                subject = question_data["subject"]
                subtopic = question_data["subtopic"]

                # Calculate average total score
                avg_score = (grammar_score + similarity_score + keyword_score + llm_relevance_score) / 4

                # Explanation generation
                expl = (
                    f"Your answer was evaluated with {grammar_score}% grammar accuracy, "
                    f"{similarity_score}% semantic similarity, {keyword_score}% keyword match, and "
                    f"{llm_relevance_score}% relevance to the question. Feedback: {feedback}"
                )

                total_score += avg_score

                evaluations.append({
                    "question": question,
                    "difficulty": difficulty,
                    "subject": subject,
                    "subtopic": subtopic,
                    "reference_answer": reference_answer,
                    "user_answer": user_answer,
                    "grammar_score": grammar_score,
                    "cosine_similarity_score": similarity_score,
                    "keyword_score": keyword_score,
                    "llm_relevance_score": llm_relevance_score,
                    "total_score": avg_score,
                    "explanation": expl
                })
            else:
                # In case the question data isn't found
                evaluations.append({
                    "question": None,
                    "reference_answer": None,
                    "difficulty": None,
                    "subject": None,
                    "subtopic": None,
                    "user_answer": user_answer,
                    "grammar_score": grammar_score,
                    "cosine_similarity_score": similarity_score,
                    "keyword_score": keyword_score,
                    "llm_relevance_score": llm_relevance_score,
                    "total_score": (grammar_score + similarity_score + keyword_score + llm_relevance_score) / 4,
                    "explanation": f"Feedback: {feedback}"
                })

        # Calculate the final score as a percentage
        cursor.execute("SELECT overall_feedback FROM test WHERE test_id = %s", (test_id,))
        test_feedback = cursor.fetchone()
        overall_feedback = test_feedback["overall_feedback"] if test_feedback else "No overall feedback available."
        print(overall_feedback)
        final_score = total_score / len(evaluations)
        return jsonify({
            "message": f"Score: {final_score:.2f}%",
            "final_score": overall_feedback,
            "evaluations": evaluations
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Ensure the cursor is closed
        if 'cursor' in locals():
            cursor.close()

@app.route('/submit_feedback', methods=['POST'])
def submitFeedback():

    try:
        data = request.get_json()
        cursor = conn.cursor()
        feedback1 = data.get('feedback1')
        feedback2 = data.get('feedback2')
        cursor.execute("INSERT INTO user_feedback (feedback1, feedback2) VALUES (%s, %s)", (feedback1, feedback2))
        conn.commit()
        return jsonify({"message": "Feedback submitted successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()

if __name__ == '__main__':
    # app.run(host="0.0.0.0", port=5000)
    app.run(host="0.0.0.0", port=5000, debug=True)
