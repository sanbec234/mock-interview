import pymysql

# Database connection details
timeout = 10
connection = pymysql.connect(
    charset="utf8mb4",
    connect_timeout=timeout,
    cursorclass=pymysql.cursors.DictCursor,
    db="Jasss",  # Replace with your actual database name
    host="mysql-390a28f4-javagarm-bf62.c.aivencloud.com",  # Replace with your actual host
    password="AVNS_XzZH4-okIadBScgtxaI",  # Replace with your actual password
    read_timeout=timeout,
    port=12629,  # Replace with your actual port if needed
    user="avnadmin",  # Replace with your actual user
    write_timeout=timeout,
)

# Insert the sanitized data into MySQL
try:
    cursor = connection.cursor()
    
    # Create a table (optional, if not already created)
   
    
    # Fetch and print all rows from the table (optional for verification)
    cursor.execute("SELECT DISTINCT subject FROM question_bank")
    result = cursor.fetchall()

    # Collect distinct subjects into a list
    distinct_subjects = [row['subject'] for row in result]
    print(distinct_subjects)

finally:
    # Ensure the connection is closed
    connection.close()


