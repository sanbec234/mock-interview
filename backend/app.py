from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import pymysql
import mysql.connector
from flask_cors import CORS
import json


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
        # Parse the JSON data
        data = request.json.get('data')
        cursor = conn.cursor()

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
    
    # Execute the insert query for all sanitized rows
        cursor.executemany(insert_query, sanitized_data)
    
    # Commit the transaction
        connection.commit()
        
        cursor.close()

        return jsonify({"message": "Data inserted successfully", "rows": 200}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"message": "Server error", "error": str(e)}), 500 

@app.route('/delete', methods=['POST'])
def delete():
    try:
        # Parse the JSON data
        data = request.json.get('data')
        cursor = conn.cursor()

        if not data or not isinstance(data, list):
            return jsonify({"message": "Invalid data format"}), 400

        
        cursor.executemany("delete from question_bank where 1=1")
    
    # Commit the transaction
        connection.commit()
        
        cursor.close()

        return jsonify({"message": "Data inserted successfully", "rows": 200}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"message": "Server error", "error": str(e)}), 500
    


@app.route('/checkresult', methods=['POST'])
def checkresult():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid or missing JSON data"}), 400

        test_id = data.get('testid')
        print(test_id)
        if not test_id:
            return jsonify({"error": "Missing test ID"}), 400

        result = []
        try:
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
                print(f"Question data for QID {qid}:", question_data)  # Debugging log

                if question_data:
                    result.append({
                        "test_id": row['test_id'],
                        "question": question_data['question'],
                        "reference_answer": question_data['answer'],
                        "answer": row['answer'],
                        "keyword": question_data['keyword']
                    })
#-------------------postman pass
            return jsonify(result), 200

        except Exception as e:
            print(f"Database Error: {e}")  # Detailed error
            return jsonify({"error": "Database error occurred"}), 500

    except Exception as e:
        print(f"Error: {e}")  # Detailed error
        return jsonify({"error": str(e)}), 500

@app.route('/api/topics', methods=['GET'])
def get_topics():
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT subject FROM question_bank")
    result = cursor.fetchall()

    # Collect distinct subjects into a list
    topics = [row['subject'] for row in result]
    cursor.close()
    return jsonify({"topics": topics})  
@app.route('/viewresult', methods=['GET'])#------------------------postman pass
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

        # Fetch the results from the history table
        cursor.execute("SELECT * FROM history WHERE test_id = %s", (test_id,))
        result = cursor.fetchall()

        # Replace the question ID with the actual question text and reference answer
        for row in result:
            question_id = row["question"]
            cursor.execute(
                "SELECT question, answer FROM question_bank WHERE id = %s", 
                (question_id,)
            )
            question_data = cursor.fetchone()
            if question_data:
                row["question"] = question_data["question"]
                row["reference_answer"] = question_data["answer"]
            else:
                row["question"] = None
                row["reference_answer"] = None

        return jsonify({"result": result}), 200

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