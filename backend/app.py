from flask import Flask, request, jsonify,send_file
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
import mysql.connector
from flask_cors import CORS
import json
import evaluation 
import io
import csv


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
        sql = """INSERT INTO user (rollno, name, email, password, department, year, cgpa) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        values = (data['rollno'], data['name'], data['email'], hashed_password, data['department'], data['year'], data['cgpa'])
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
    print(data)
    try:
        cursor = conn.cursor()

        print(data['userType'])
        cursor.execute("SELECT * FROM user WHERE email = %s", (data['email'],))
        user = cursor.fetchone()
        if user and check_password_hash(user['password'], data['password']):
            return jsonify({'message': 'Login successful', 'user': user["email"]}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()

# Start Test Endpoint
@app.route('/start_test', methods=['POST'])
def start_test():
    data = request.get_json()
    roll_no = data.get('email')
    num_questions = data.get('numQuestions')
    selected_topics = data.get('selectedTopics')
    questions_indices = create_question_indices(num_questions, selected_topics)
    question_ids_str = ','.join(map(str, questions_indices))
    roll_no="22i434"
    print(data)
    # code to insert a new test record in DB
    cursor = conn.cursor()
    sql = """INSERT INTO test (rollno, question_indices) VALUES (%s, %s)"""
    values = (roll_no, question_ids_str)
    cursor.execute(sql, values)
    test_id = cursor.lastrowid
    print(test_id)
    conn.commit()

    # Convert the list of question IDs into a string format for the query
    cursor.execute(f"SELECT id, question FROM question_bank WHERE id IN ({question_ids_str})")
    completed_tests = cursor.fetchall()

    questions_list = []

    for test in completed_tests:
        questions_list.append({'id': test['id'], 'question': test['question']})

    if len(questions_indices) == 0:
      return jsonify({'message' : 'Failed to fetch questions'}), 201
    
    return jsonify({'message': 'New test created', 'questions_id': questions_list, "test_id": test_id}), 201


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
        roll_no="22i434"
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
        print(result)
        result_dict = json.loads(result)
        print(result_dict)
        formatted_result = {
            "incomplete_tests": result_dict["incomplete_tests"],
            "tests_with_pending_results": result_dict["tests_with_pending_results"],
            "tests_with_results": result_dict["tests_with_results"]
        }
        print("dtfyghj",formatted_result)
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

@app.route('/resume', methods=['POST'])
def resume_test():
    data = request.get_json()
    test_id = data.get('testId')
    print(f"Resume Test ID: {test_id}")
    # Perform the desired action for resuming the test
    return jsonify({"message": f"Test {test_id} resumed successfully!"})

@app.route('/check_result', methods=['POST'])
def checkresult():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400

        test_id = data.get('testId')
        api="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"
        print(test_id)
        test_id=4
        if not test_id:
            return jsonify({"error": "Missing test ID"}), 400

        result = []
        cursor = conn.cursor()  # Enable dictionary output

        # Query the history table
        cursor.execute("SELECT * FROM history WHERE test_id = %s", (test_id,))
        rows = cursor.fetchall()
        print("Rows fetched from history:", rows)  # Debugging log

        if not rows:
            print(f"No history found for test_id: {test_id}")
            return jsonify({"error": "No data found for the given test ID"}), 404

        for row in rows:
            # Retrieve the question ID safely
            qid = row.get('question')
            if not qid:
                print(f"Invalid QID in row: {row}")
                continue

            # Query the question table
            cursor.execute("SELECT question, answer, keyword FROM question_bank WHERE id = %s", (qid,))
            question_data = cursor.fetchone()
            # print(f"Question data for QID {qid}:", question_data)  # Debugging log

            if question_data:
                result.append({
                    "qid":qid,
                    "test_id": row['test_id'],
                    "question": question_data['question'],
                    "reference_answer": question_data['answer'],
                    "answer": row['answer'],
                    "keyword": question_data['keyword']
                })

        for question in result:
            similarity_score = evaluation.calculate_cosine_similarity(question['reference_answer'], question['answer'])
            grammar_check = evaluation.check_grammar(question['answer'])
            llm_score, reason = evaluation.check_relevance(question['question'], question['reference_answer'], question['answer'], api)
            keywords_score, _ = evaluation.calculate_keyword_score(question['answer'], question['keyword'].split(", "))

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

        conn.commit()
        return jsonify([{"message": "Evaluation completed and data saved successfully"}]), 200

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
        test_id=4
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
                "SELECT question, answer FROM question_bank WHERE id = %s", 
                (question_id,)
            )
            question_data = cursor.fetchone()

            if question_data:
                question = question_data["question"]
                reference_answer = question_data["answer"]

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
                    "user_answer": user_answer,
                    "grammar_score": grammar_score,
                    "cosine_similarity_score": similarity_score,
                    "keyword_score": keyword_score,
                    "llm_relevance_score": llm_relevance_score,
                    "total_score": (grammar_score + similarity_score + keyword_score + llm_relevance_score) / 4,
                    "explanation": f"Feedback: {feedback}"
                })

        # Calculate the final score as a percentage
        final_score = total_score / len(evaluations)
        print(evaluations)
        return jsonify({
            "message": f"Score: {final_score:.2f}%",
            "final_score": final_score,
            "evaluations": evaluations
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Ensure the cursor is closed
        if 'cursor' in locals():
            cursor.close()




#------------------------------------ THE KING MASTER  JAVA----------------------------------------------



#------------------------------------ the work yet to complete 
# check result
# dowload  
# convert questionbank to question issue question in questionbank is varchar which support unique and question in question is text or longtext not support unique -------------------------------------------------------------------------------------------- 




# Get Completed and Incomplete Tests Endpoint
# @app.route('/test_completed', methods=['POST'])
# def test_completed():
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "Invalid or missing JSON data"}), 400

#         roll_no = data.get('rollno')
#         test_id = data.get('testid')
#         answers = data.get('answers')
#         print(answers)

#         if not roll_no or not answers:
#             return jsonify({"error": "Missing rollno or answers"}), 400

#         return jsonify(answers), 200

#     except Exception as e:
#         # Handle any errors
#         return jsonify({"error": str(e)}), 500

    # try:
    #     cursor = conn.cursor()

    #     # Retrieve completed tests
    #     cursor.execute("SELECT * FROM test WHERE iscompleted = TRUE")
    #     completed_tests = cursor.fetchall()

    #     # Retrieve incomplete tests
    #     cursor.execute("SELECT * FROM test WHERE iscompleted = FALSE")
    #     incomplete_tests = cursor.fetchall()

    #     return jsonify({
    #         'completed_tests': completed_tests,
    #         'incomplete_tests': incomplete_tests
    #     }), 200
    # except Exception as e:
    #     return jsonify({'error': str(e)}), 400
    # finally:
    #     cursor.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)