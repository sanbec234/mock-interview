import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import './../completion-page/completionpage.css';

// Define types for the evaluation data
interface Evaluation {
  question: string;
  reference_answer: string;
  user_answer: string;
  explanation:string;
  grammar_score: number;
  cosine_similarity_score: number;
  keyword_score: number;
  llm_relevance_score: number;
  total_score: number;
}

interface CompletionPageProps {}

const CompletionPage: React.FC<CompletionPageProps> = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]); // To hold evaluations data
  const [finalScore, setFinalScore] = useState<number>(0); // Final score
  const [message, setMessage] = useState<string>(''); // Completion message
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error handling
  const navigate = useNavigate(); // Hook for redirection

  // Fetch the completion status and evaluation data from the backend
  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/completion-page');
        const data = await response.json();
        setEvaluations(data.evaluations); // Set evaluation data
        setFinalScore(data.final_score);  // Set final score
        setMessage(data.message); // Set the completion message
        setLoading(false); // Stop loading
      } catch (error) {
        console.error('Error fetching completion data:', error);
        setError('Failed to load the completion data.'); // Error handling
        setLoading(false); // Stop loading
      }
    };

    checkCompletionStatus();
  }, [navigate]); // Depend on navigate for redirect handling

  // Display loading or error state if necessary
  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="main-content">
          <div className="question-window">
            <h2>Loading...</h2>
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
          <h2>{message}</h2> {/* Display the message from backend */}
          <h3>Your Final Score: {finalScore}%</h3> {/* Display final score */}
        </div>

        <div className="evaluations">
          {evaluations.length > 0 ? (
            evaluations.map((evaluation, index) => (
              <div key={index} className="evaluation">
                <h4>Question {index + 1}: {evaluation.question}</h4>
                <p><strong>Reference Answer:</strong> {evaluation.reference_answer}</p>
                <p><strong>Your Answer:</strong> {evaluation.user_answer}</p>
                <p><strong>Your Answer:</strong> {evaluation.explanation}</p>

                <div className="scores">
                  <p><strong>Grammar Score:</strong> {evaluation.grammar_score}</p>
                  <p><strong>Cosine Similarity Score:</strong> {evaluation.cosine_similarity_score}</p>
                  <p><strong>Keyword Score:</strong> {evaluation.keyword_score}</p>
                  <p><strong>LLM Relevance Score:</strong> {evaluation.llm_relevance_score}</p>
                </div>

                <p><strong>Total Score for this Question:</strong> {evaluation.total_score}</p>
                <hr />
              </div>
            ))
          ) : (
            <p>No evaluations available.</p>
          )}
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
