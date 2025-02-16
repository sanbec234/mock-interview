import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "./../../components/Header/Header";
import Footer from "./../../components/Footer/Footer";
import "./../completion-page/completionpage.css";

interface Evaluation {
  question: string;
  difficulty: string;
  subject: string;
  subtopic: string;
  reference_answer: string;
  user_answer: string;
  explanation: string;
  grammar_score: number;
  cosine_similarity_score: number;
  keyword_score: number;
  llm_relevance_score: number;
  total_score: number;
}

const CompletionPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { testid: paramTestId } = useParams(); // Get testid from URL params

  useEffect(() => {
    const fetchCompletionData = async () => {
      const storedTestId = localStorage.getItem("test_id"); // Get test_id from localStorage
      const testid = paramTestId || storedTestId; // Use paramTestId if available, otherwise fallback to localStorage

      if (!testid) {
        setError("Test ID not found. Please try again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/view_result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testid }),
        });
        const data = await response.json();

        if (response.ok) {
          setEvaluations(data.evaluations);
          setFinalScore(data.final_score);
          setMessage(data.message);
        } else {
          setError(data.error || "Failed to load the completion data.");
        }
      } catch (err) {
        console.error("Error fetching completion data:", err);
        setError("Failed to load the completion data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionData();
  }, [paramTestId]);

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="main-content">
          <div className="question-window">
            <h2>Loading...</h2>
            <div className="spinner"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <Header />
        <div className="main-content">
          <div className="question-window">
            <h2>{error}</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="question-window">
          <h2>{message}</h2>
          <h3>Your Final Score: {finalScore}%</h3>
        </div>

        <div className="evaluations">
          {evaluations.map((evaluation, index) => (
            <div key={index} className="evaluation">
              <div>
                <span className="subject">{evaluation.subject}</span>
                <span className="subtopic">{evaluation.subtopic}</span>
                <span
                  className="difficulty"
                  style={
                    evaluation.difficulty == "Easy"
                      ? { backgroundColor: "green" }
                      : evaluation.difficulty == "Hard"
                      ? { backgroundColor: "red" }
                      : { backgroundColor: "yellow" }
                  }
                >
                  {evaluation.difficulty}
                </span>
              </div>
              <h4>
                Question {index + 1}: {evaluation.question}
              </h4>
              <p>
                <strong>Reference Answer:</strong> {evaluation.reference_answer}
              </p>
              <p>
                <strong>Your Answer:</strong> {evaluation.user_answer}
              </p>
              <p>
                <strong>Explanation:</strong> {evaluation.explanation}
              </p>

              <div className="scores">
                <p>
                  <strong>Grammar Score:</strong> {evaluation.grammar_score}
                </p>
                <p>
                  <strong>Cosine Similarity Score:</strong>{" "}
                  {evaluation.cosine_similarity_score}
                </p>
                <p>
                  <strong>Keyword Score:</strong> {evaluation.keyword_score}
                </p>
                <p>
                  <strong>LLM Relevance Score:</strong>{" "}
                  {evaluation.llm_relevance_score}
                </p>
              </div>

              <p>
                <strong>Total Score for this Question:</strong>{" "}
                {evaluation.total_score}
              </p>
              <hr />
            </div>
          ))}
        </div>

        <div className="completion-message">
          <p>Thank you for completing the test!</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompletionPage;
