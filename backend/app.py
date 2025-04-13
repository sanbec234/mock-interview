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
from collections import defaultdict

app = Flask(__name__)
app.secret_key = 'your_secret_key' 
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app)


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
        print("Received data:", data)

        # Extract data from the request
        email = data.get('email')
        topics = data.get('selectedTopics')
        num_questions_per_topic = 5  # Number of questions per topic

        # Validate input data
        if not email or not topics:
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
            difficulty = topic_data.get('difficulty')

            if not topic or not difficulty:
                continue  # Skip invalid data

            # Fetch questions for the current topic and difficulty
            cursor.execute(
                "SELECT id FROM question_bank WHERE subject = %s AND difficulty_level = %s ORDER BY RAND() LIMIT %s",
                (topic, difficulty, num_questions_per_topic),
            )
            fetched_questions = cursor.fetchall()

            # Collect question IDs
            question_ids.extend([q['id'] for q in fetched_questions])

        if not question_ids:
            return jsonify({'message': 'No questions found for the selected topics and difficulty'}), 400

        # Convert list of question IDs into a comma-separated string
        question_ids_str = ','.join(map(str, question_ids))

        # Insert a new test record into the database
        sql = "INSERT INTO test (rollno, question_indices) VALUES (%s, %s)"
        values = (roll_no, question_ids_str)
        cursor.execute(sql, values)
        conn.commit()

        test_id = cursor.lastrowid

        # Fetch the actual questions
        cursor.execute(
            f"SELECT id, question FROM question_bank WHERE id IN ({question_ids_str})"
        )
        questions = cursor.fetchall()

        questions_list = [
            {'id': question['id'], 'question': question['question']}
            for question in questions
        ]

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

@app.route('/resultlist', methods=['POST'])
def resultlist():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()

    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"error": "Missing email"}), 400

        email = data['email']
        print(f"📩 Received request with email: {email}")

        # Fetch user roll number
        cursor.execute("SELECT rollno FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404
        
        roll_no = user['rollno']  # Correct extraction
        print(f"🎯 User Roll Number: {roll_no}")

        # Fetch test results with topics
        cursor.execute("""
            SELECT 
                t.test_id, 
                t.created_at, 
                t.iscompleted, 
                t.isresult, 
                GROUP_CONCAT(DISTINCT qb.subject ORDER BY qb.subject SEPARATOR ', ') AS topics
            FROM test t
            LEFT JOIN question_bank qb ON FIND_IN_SET(qb.id, t.question_indices) > 0
            WHERE t.rollno = %s
            GROUP BY t.test_id;
        """, (roll_no,))
        results = cursor.fetchall()

        print(f"📊 Test Results: {results}")

        if not results:
            return jsonify({"tests": []}), 200  # Return empty list if no tests exist

        # Process results
        incomplete_tests = []
        pending_tests = []
        completed_tests = []

        for row in results:
            test_id = row['test_id']
            created_at = row['created_at'].strftime('%Y-%m-%d %H:%M:%S') if row['created_at'] else None
            iscompleted = row['iscompleted']
            isresult = row['isresult']
            topics = row['topics'] or "No topics"  # Handle case where topics are null

            test_entry = {
                "test_id": test_id,
                "created_at": created_at,
                "topics": topics
            }

            if iscompleted == 0:
                incomplete_tests.append(test_entry)
            elif iscompleted == 1 and isresult == 0:
                pending_tests.append(test_entry)
            elif iscompleted == 1 and isresult == 1:
                completed_tests.append(test_entry)

        response_data = {
            "incomplete_tests": incomplete_tests[::-1],
            "tests_with_pending_results": pending_tests[::-1],
            "tests_with_results": completed_tests[::-1]
        }

        return jsonify(response_data), 200

    except mysql.connector.Error as db_error:
        print(f"❌ Database Error: {db_error}")
        return jsonify({'error': f"Database error: {db_error}"}), 500
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return jsonify({'error': f"Unexpected error: {e}"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

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

        # Ensure DB connection is active
        get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection issue"}), 500

        result = []
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM history WHERE test_id = %s", (test_id,))
        rows = cursor.fetchall()
        print("Rows fetched from history:", rows)

        if not rows:
            return jsonify({"error": "No data found for the given test ID"}), 404

        for row in rows:
            qid = row.get('question')
            if not qid:
                continue

            cursor.execute("SELECT question, answer, keyword FROM question_bank WHERE id = %s", (qid,))
            question_data = cursor.fetchone()

            if not question_data:
                cursor.execute("SELECT question, answer, keyword FROM delete_question WHERE id = %s", (qid,))
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

        feedback_list = []
        for question in result:
            similarity_score = evaluation.calculate_cosine_similarity(question['reference_answer'], question['answer'])
            grammar_check = evaluation.check_grammar(question['answer'])
            llm_score, reason = evaluation.check_relevance(question['question'], question['reference_answer'], question['answer'], api_key)
            keywords_score, _ = evaluation.calculate_keyword_score(question['answer'], question['keyword'].split(", "))

            feedback_list.append(reason)

            cursor.execute(
                """UPDATE history SET similarity_score = %s, keyword_matching = %s, grammar_check = %s, 
                llm_score = %s, feedback = %s WHERE test_id = %s AND question = %s""",
                (str(similarity_score), str(keywords_score), str(grammar_check), str(llm_score), reason, str(question['test_id']), str(question['qid']))
            )

        df = pd.DataFrame(result)
        df["feedback"] = feedback_list
        overall_feedback = get_overall_feedback(df, test_id, api_key)

        cursor.execute("UPDATE test SET isresult = 1, overall_feedback = %s WHERE test_id = %s", (overall_feedback, test_id))
        conn.commit()

        return jsonify([{"message": "Evaluation completed and data saved successfully", "overall_feedback": overall_feedback}]), 200

    except pymysql.Error as db_error:
        print(f"Database error: {db_error}")
        conn.rollback()
        return jsonify({"error": f"Database error: {db_error}"}), 500

    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": f"Unexpected error: {e}"}), 500

    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()


@app.route('/submit_answers', methods=['POST'])
def submit_answers():
    try:
        # Get JSON data from the request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400

        # Log the received payload
        print("Received payload:", data)

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
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Prepare the SQL statement
        sql = """
        INSERT INTO history (test_id, question, answer, time_taken)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE answer = VALUES(answer), time_taken = VALUES(time_taken)
        """

        # Insert each answer into the table
        for ans in answers:
            question_id = ans.get('id')
            answer_text = ans.get('answer')
            time_taken = ans.get('time_taken')

            # Log each answer being processed
            print(f"Processing answer: test_id={test_id}, question_id={question_id}, answer_text={answer_text}, time_taken={time_taken}")

            if question_id is None or answer_text is None or time_taken is None:
                print(f"Skipping invalid entry: {ans}")
                continue  # Skip invalid entries

            try:
                cursor.execute(sql, (test_id, question_id, answer_text, time_taken))
            except mysql.connector.Error as db_error:
                print(f"Database error: {db_error}")
                continue  # Skip this entry and proceed with the next one

        # Update the test status to completed
        update_query = "UPDATE test SET iscompleted = 1 WHERE test_id = %s"
        cursor.execute(update_query, (test_id,))

        # Commit the transaction
        conn.commit()

        return jsonify({"message": "Answers submitted successfully"}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Database error occurred"}), 500

    finally:
        # Close the cursor and connection
        if cursor:
            cursor.close()
        if conn:
            conn.close()

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

        print("Sanitized data to insert:", sanitized_data)
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
        cursor = conn.cursor()
        cursor.execute("DELETE FROM question_bank WHERE 1=1")  # Deletes all records from the 'question' table
        conn.commit()
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
        column_names = [i[0] for i in cursor.description]
        output = io.StringIO()  # Use StringIO for text mode
        csv_writer = csv.writer(output)
        csv_writer.writerow(column_names)
        csv_writer.writerows(rows)
        output.seek(0)
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
    try:
        data = request.get_json()
        test_id = data.get('testId')

        if not test_id:
            return jsonify({"error": "Test ID is required"}), 400

        # Connect to the database
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(pymysql.cursors.DictCursor)  # Ensure dictionary output
        # Fetch test details including question_indices
        cursor.execute("SELECT * FROM test WHERE test_id = %s", (test_id,))
        test = cursor.fetchone()

        if not test:
            return jsonify({"error": "Test not found"}), 404

        # Extract question indices
        question_indices = test.get("question_indices")
        if not question_indices:
            return jsonify({"error": "No question indices found for this test"}), 404

        # Convert question_indices from string to a list of integers
        question_indices_list = list(map(int, question_indices.split(',')))

        # Fetch topics from question_bank (assuming subject column exists)
        cursor.execute(
            "SELECT DISTINCT subject FROM question_bank WHERE id IN %s",
            (tuple(question_indices_list),)
        )
        topics = [row['subject'] for row in cursor.fetchall()]  # Extract topics list

        # Fetch questions for the test using question_indices
        format_strings = ','.join(['%s'] * len(question_indices_list))  # Correct formatting for SQL
        cursor.execute(f"""
            SELECT qb.id AS question_id, qb.question, qb.answer AS reference_answer, 
                   qb.keyword, qb.subject AS topics,
                   h.answer AS user_answer, h.time_taken, h.similarity_score, 
                   h.keyword_matching, h.grammar_check, h.llm_score, h.feedback
            FROM question_bank qb
            LEFT JOIN history h ON qb.id = h.question AND h.test_id = %s
            WHERE qb.id IN ({format_strings})
        """, [test_id] + question_indices_list)
        questions = cursor.fetchall()

        if not questions:
            return jsonify({"error": "No questions found for this test"}), 404

        # Prepare the response
        response = {
            "test_id": test_id,
            "topics": topics,  # Send topics list
            "questions": questions,
        }

        return jsonify(response), 200

    except pymysql.Error as db_error:
        print(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500

    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": f"Unexpected error: {e}"}), 500

    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

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

@app.route('/students', methods=['GET'])
def get_students():
    try:
        cursor = conn.cursor()  # ✅ Use dictionary cursor

        # Fetch student data
        student_query = """
            SELECT classuser, rollno AS id, name, yearuser, email, department 
            FROM user
            ORDER BY classuser, rollno;
        """
        cursor.execute(student_query)
        students = cursor.fetchall()

        if not students:
            return jsonify({"error": "No students found"}), 404

        # Fetch test data (Only completed tests with results)
        test_query = """
            SELECT test.test_id, test.rollno AS student_id, test.created_at,
                   (history.similarity_score * 0.15 + history.keyword_matching * 0.15 + 
                    history.grammar_check * 0.20 + history.llm_score * 0.50) AS total_score,
                   COALESCE(history.time_taken, 99999) AS time_taken  # ✅ Handle NULL values
            FROM test
            JOIN history ON test.test_id = history.test_id
            WHERE test.iscompleted = 1 AND test.isresult = 1
        """
        cursor.execute(test_query)
        tests = cursor.fetchall()

        # Organize test data by student_id
        student_tests = defaultdict(list)
        student_scores = defaultdict(list)  # Track scores for ranking
        student_times = defaultdict(list)  # Track time taken for ranking

        for test in tests:
            score = round(test["total_score"], 2)
            time_taken = test["time_taken"] or 99999  # ✅ Default high value for ranking
            student_tests[test["student_id"]].append({
                "test_id": test["test_id"],
                "created_at": test["created_at"].strftime("%Y-%m-%d %H:%M:%S"),
                "mark": score,
                "time_taken": time_taken
            })
            student_scores[test["student_id"]].append(score)
            student_times[test["student_id"]].append(time_taken)

        # Calculate average scores, total points, and average time taken
        student_points = {}
        for student_id, scores in student_scores.items():
            avg_score = sum(scores) / len(scores) if scores else 0
            total_points = sum(scores)  # Example: Points are the sum of all scores
            avg_time = sum(student_times[student_id]) / len(student_times[student_id]) if student_times[student_id] else 99999
            student_points[student_id] = (avg_score, total_points, avg_time)

        # Rank students by average score (higher is better), tie-breaker: lower avg time
        ranked_students = sorted(student_points.items(), key=lambda x: (-x[1][0], x[1][2]))

        # Assign ranks
        rank_dict = {}
        current_rank = 1
        for i, (student_id, (avg_score, total_points, avg_time)) in enumerate(ranked_students):
            if i > 0 and (avg_score < ranked_students[i - 1][1][0] or avg_time > ranked_students[i - 1][1][2]):
                current_rank = i + 1  # Update rank only when score decreases or time increases
            rank_dict[student_id] = {"rank": current_rank, "points": total_points}

        # Group students by class
        students_dict = defaultdict(list)
        for student in students:
            class_name = student["classuser"] or "Unknown Class"
            student_id = student["id"]

            student_info = {
                "id": student_id,
                "name": student["name"] or "Unknown",
                "yearuser": f"{student['yearuser']}th" if student["yearuser"] else "N/A",
                "email": student["email"] or "N/A",
                "department": student["department"] or "N/A",
                "tests": student_tests.get(student_id, []),
                "rank": rank_dict.get(student_id, {}).get("rank", "N/A"),
                "points": rank_dict.get(student_id, {}).get("points", 0)
            }
            students_dict[class_name].append(student_info)

        return jsonify(dict(students_dict)), 200

    except mysql.connector.Error as db_error:
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {e}"}), 500
    finally:
        if 'cursor' in locals():
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
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400

        test_id = data.get('testid')
        if not test_id:
            return jsonify({"error": "Missing test ID"}), 400

        cursor = conn.cursor()

        # Fetch all history rows for the given test_id
        cursor.execute("""
            SELECT 
                h.test_id, h.question, h.answer AS user_answer, 
                COALESCE(h.similarity_score, 0) AS similarity_score,
                COALESCE(h.keyword_matching, 0) AS keyword_score,
                COALESCE(h.grammar_check, 0) AS grammar_score,
                COALESCE(h.llm_score, 0) AS llm_relevance_score,
                COALESCE(h.feedback, '') AS feedback,
                COALESCE(h.time_taken, 0) AS time_taken
            FROM history h
            WHERE h.test_id = %s
        """, (test_id,))
        history_rows = cursor.fetchall()

        if not history_rows:
            return jsonify({"error": "No results found for the given test ID"}), 404

        evaluations = []
        total_score = 0
        total_time_taken = 0
        subject_scores = {}
        difficulty_counts = {"Easy": 0, "Medium": 0, "Hard": 0}

        for row in history_rows:
            question_id = row["question"]
            user_answer = row["user_answer"]
            similarity_score = row["similarity_score"]
            keyword_score = row["keyword_score"]
            grammar_score = row["grammar_score"]
            llm_relevance_score = row["llm_relevance_score"]
            feedback = row["feedback"]
            time_taken = row["time_taken"]

            total_time_taken += time_taken

            cursor.execute(
                "SELECT question, answer, subject, subtopic, difficulty_level FROM question_bank WHERE id = %s", 
                (question_id,)
            )
            question_data = cursor.fetchone()

            # If not found, check in delete_question
            if not question_data:
                cursor.execute(
                    "SELECT question, answer, subject, subtopic, difficulty_level FROM delete_question WHERE id = %s", 
                    (question_id,)
                )
                question_data = cursor.fetchone()

            if question_data:
                question = question_data["question"]
                reference_answer = question_data["answer"]
                difficulty = question_data["difficulty_level"]
                subject = question_data["subject"]
                subtopic = question_data["subtopic"]

                avg_score = (grammar_score * 100 + similarity_score + keyword_score + (llm_relevance_score * 20)) / 4
                total_score += avg_score

                # Update subject scores
                if subject not in subject_scores:
                    subject_scores[subject] = {"total": 0, "count": 0}
                subject_scores[subject]["total"] += avg_score
                subject_scores[subject]["count"] += 1

                # Update difficulty counts
                if difficulty in difficulty_counts:
                    difficulty_counts[difficulty] += 1

                explanation = (
                    f"Your answer was evaluated with {grammar_score*100:.2f}% grammar accuracy, "
                    f"{similarity_score:.2f}% semantic similarity, {keyword_score:.2f}% keyword match, and "
                    f"{llm_relevance_score * 20:.2f}% relevance to the question. Feedback: {feedback}"
                )

                evaluations.append({
                    "question": question,
                    "difficulty": difficulty,
                    "subject": subject,
                    "subtopic": subtopic,
                    "reference_answer": reference_answer,
                    "user_answer": user_answer,
                    "grammar_score": round(grammar_score * 100, 2),
                    "cosine_similarity_score": round(similarity_score, 2),
                    "keyword_score": round(keyword_score, 2),
                    "llm_relevance_score": round(llm_relevance_score * 20, 2),
                    "total_score": round(avg_score, 2),
                    "explanation": explanation,
                    "time_taken": round(time_taken, 2)
                })

        # Prepare subject performance data
        subject_performance = [
            {"subject": sub, "total_score": round(data["total"]/data["count"], 2)}
            for sub, data in subject_scores.items()
        ]

        # Prepare difficulty distribution data
        difficulty_distribution = [
            {"name": "Easy", "value": difficulty_counts["Easy"]},
            {"name": "Medium", "value": difficulty_counts["Medium"]},
            {"name": "Hard", "value": difficulty_counts["Hard"]},
        ]

        # Fetch overall feedback
        cursor.execute("SELECT overall_feedback FROM test WHERE test_id = %s", (test_id,))
        test_feedback = cursor.fetchone()
        overall_feedback = test_feedback["overall_feedback"] if test_feedback and "overall_feedback" in test_feedback else "No overall feedback available."

        # Calculate final score
        final_score = round((total_score / len(evaluations)), 2)

        return jsonify({
            "message": f"Score: {final_score:.2f}%",
            "final_score": final_score,
            "overall_feedback": overall_feedback,
            "evaluations": evaluations,
            "total_time_taken": round(total_time_taken, 2),
            "subject_performance": subject_performance,
            "difficulty_distribution": difficulty_distribution
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
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
    app.run(host="0.0.0.0", port=5001)
    # app.run(host="0.0.0.0", port=5001, debug=True)
