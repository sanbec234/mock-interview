from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import language_tool_python
from groq import Groq 
import re

def calculate_cosine_similarity(reference_answer, user_answer):
    vectorizer = TfidfVectorizer()
    answers = [reference_answer, user_answer]
    tfidf_matrix = vectorizer.fit_transform(answers)
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
    return round(cosine_sim[0][0] * 100, 2) 


def calculate_keyword_score(user_answer, keywords):
    if not keywords:
        return 0, []
    print(user_answer)
    print(keywords)
    user_keywords = set(re.findall(r'\b\w+\b', user_answer.lower()))
    predefined_keywords = set(re.findall(r'\b\w+\b', ' '.join(keywords).lower()))

    #predefined_keywords = set(kw.lower().strip() for kw in keywords)
    
    common_keywords = user_keywords.intersection(predefined_keywords)
    keyword_score = (len(common_keywords) / len(predefined_keywords)) * 100 if predefined_keywords else 0
    print(user_keywords,predefined_keywords,common_keywords,sep="\n\n\n")
    return round(keyword_score, 2), list(common_keywords)


def check_grammar(user_answer):
    """
    Evaluate the grammar of a user's answer and return a grammar score.

    Args:
        user_answer (str): The user's answer to evaluate.

    Returns:
        float: A grammar score between 0 and 1, where 1 indicates perfect grammar.
    """
    if not user_answer.strip():
        return 0.0  # Return 0 for empty or whitespace-only answers

    # Initialize LanguageTool
    tool = language_tool_python.LanguageToolPublicAPI('en')  # English grammar checking

    # Check for grammar errors
    matches = tool.check(user_answer)

    # Calculate the number of words in the answer
    words = user_answer.split()
    num_words = len(words)

    # Calculate the number of grammar errors
    num_errors = len(matches)

    # Minimum word count for a valid answer
    MIN_WORD_COUNT = 5  # Adjust this threshold as needed

    # Penalize short answers
    if num_words < MIN_WORD_COUNT:
        return max(0, 1 - (MIN_WORD_COUNT - num_words) / MIN_WORD_COUNT)

    # Normalize the grammar score based on the number of errors and words
    if num_words == 0:
        return 0.0  # Avoid division by zero for empty answers

    # Grammar score formula: 1 - (number of errors / number of words)
    # This ensures the score is proportional to the error density
    grammar_score = 1 - (num_errors / num_words)

    # Ensure the score is within the range [0, 1]
    grammar_score = max(0, min(1, grammar_score))

    return round(grammar_score, 2)
from groq import Groq  # Assuming Groq has such an import structure (Replace with correct one if not)

def check_relevance(question, reference_answer, user_answer,api):
    client = Groq(api_key=api)
    
    relevance_score_prompt = f"""
    Analyze and rate the relevance of the user's answer in relation to the given question and reference answer.
    Evaluation Criteria: Consider the completeness, accuracy, and contextual alignment with the reference answer.
    Scoring: Provide a relevance score between 0 and 5 (0 = completely irrelevant, 5 = highly relevant).
    Response Format: Begin your response with 'Score: ', followed by the numeric score. Then, provide a simple explanation supporting your evaluation.

    Question: {question}
    Reference Answer: {reference_answer}
    User Answer: {user_answer}
    """
    
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": relevance_score_prompt}
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None
    )
    
    response = ""
    for chunk in completion:
        response += chunk.choices[0].delta.content or ""
    
    print("Full API Response:")
    print(response)  # For debugging purposes
    
    try:
        # Extract the score and explanation
        score_line = response.split("\n")[0]  # Score: <number>
        explanation = response.split("\n\n")[1] if "\n\n" in response else "No explanation provided."
        
        score = float(score_line.split(": ")[1])
        
        # Return both score and explanation
        return score, explanation.strip()
    except Exception as e:
        print("Error parsing response: {}".format(e))
        return None, f"Error: Unable to process response. Details: {e}"


def check_introduction_relevance( user_introduction,api):
    from groq import Groq  # Ensure the correct library import
    job_description = """
    Frontend Developer role requiring skills in React, JavaScript, HTML, CSS, 
    and experience with REST APIs. The ideal candidate should have a strong understanding 
    of responsive design, cross-browser compatibility, and state management tools like Redux. 
    Preferred skills include knowledge of TypeScript, CI/CD pipelines, and cloud services.
    """
    client = Groq(api_key=api) 

    relevance_score_prompt = f"""
    Evaluate the relevance of the user's introduction in the context of the given job description.\n
    Evaluation Criteria: Assess how well the introduction aligns with the key responsibilities, skills, and qualifications listed in the job description. Consider clarity, specificity, and professionalism.\n
    Scoring: Provide a relevance score between 0 and 5 (0 = completely irrelevant, 5 = highly relevant).\n
    Response Format: Begin your response with 'Score: ', followed by the numeric score. Then, provide a simple explanation supporting your evaluation.\n

    Job Description: {job_description}\n
    User Introduction: {user_introduction}\n
    """

    # Make sure the model name is correct as per Groq's documentation
    completion = client.chat.completions.create(
        model="llama3-8b-8192",  # Replace with correct Groq model name
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": relevance_score_prompt}],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None
    )

    # Collect the response from the API
    response = ""
    for chunk in completion:
        response += chunk.choices[0].delta.content or ""

    print(response)  # Print the full response (for debugging)

    # Extract the numeric score from the response
    try:
        score_line = response.split("\n")[0]  # Score: <number>
        explanation = response.split("\n\n")[1] if "\n\n" in response else "No explanation provided."
        
        score = float(score_line.split(": ")[1])
        
        # Return both score and explanation
        return score, explanation.strip()
    except Exception as e:
        print("Error parsing response: {}".format(e))
        return None

def append_evaluation_to_file(evaluations, mark):
    with open("evaluation_results.txt", "a") as f:
        # Write all evaluations to the file
        for evaluation in evaluations:
            f.write(f"Question: {evaluation['question']}\n")
            f.write(f"Reference Answer: {evaluation['reference_answer']}\n")
            f.write(f"User Answer: {evaluation['user_answer']}\n")
            f.write(f"Grammar Score: {evaluation['grammar_score']}\n")
            f.write(f"Cosine Similarity Score: {evaluation['cosine_similarity_score']}\n")
            f.write(f"Keyword Score: {evaluation['keyword_score']}\n")
            f.write(f"LLM Relevance Score: {evaluation['llm_relevance_score']}\n")
            f.write(f"LLM Suggestion: {evaluation['explanation']}\n")
            f.write(f"Total Score: {evaluation['total_score']}\n")
            f.write("-" * 30 + "\n")
        
        # Write the final score to the file
        final_score = mark
        f.write("\nTotal Test Score: {}%\n\n".format(final_score))


