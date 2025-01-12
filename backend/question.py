import pandas as pd
import os
def get_least_asked_questions(difficulty_level, num_questions=1):
    # Specify the path to the CSV file
    base_dir = os.path.dirname(__file__)  # Directory of the current script
    csv_file = os.path.join(base_dir, "questions_without_errors1.csv")

    # Load the CSV file into a DataFrame with encoding specified
    try:
        df = pd.read_csv(csv_file, encoding='ISO-8859-1')  # Adjust encoding if needed
    except Exception as e:
        print("Error reading the CSV file: {}".format(e))
        return []

    # Remove numbers from the 'Question' column
    df['Question'] = df['Question'].str.replace(r'^\d+\s+', '', regex=True)

    # Add 'Count' column if not present
    if 'Count' not in df.columns:
        df['Count'] = 0

    # Filter based on difficulty level
    filtered_df = df[df['Difficulty Level'] == difficulty_level]

    # Sort by 'Count' column
    sorted_df = filtered_df.sort_values(by='Count')

    # Select the least asked questions
    selected_questions = sorted_df.head(num_questions)

    # Update the 'Count' value for the selected questions
    for question in selected_questions['Question']:
        df.loc[df['Question'] == question, 'Count'] += 1

    # Save the updated DataFrame back to the CSV file
    try:
        df.to_csv(csv_file, index=False, encoding='ISO-8859-1')  # Match encoding used during reading
    except Exception as e:
        print("Error reading the CSV file: {}".format(e))

    return selected_questions
