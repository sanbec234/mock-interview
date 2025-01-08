new_questions = get_least_asked_questions(diff)
    count += 1
    print(new_questions)
    ans = ','.join(new_questions["Answer"])
    ques = ','.join(new_questions["Question"])
    key = ','.join(new_questions["Keyword"])