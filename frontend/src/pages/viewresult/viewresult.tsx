import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./view-result-page.css";

const ViewResultPage: React.FC = () => {
  const [testId, setTestId] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setResults([]);

    if (!testId.trim()) {
      setMessage("Please enter a valid Test ID.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/view_result", {
        method: "POST", // ✅ Corrected to POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testid: testId }), // ✅ Send testId in body
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.evaluations); // ✅ Corrected response key
        setMessage(`Final Score: ${data.message}`);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to fetch results."}`);
      }
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="result-form-container">
          <h2>View Results</h2>
          <form onSubmit={fetchResults}>
            <div className="form-group">
              <label htmlFor="testId">Test ID</label>
              <input
                type="text"
                id="testId"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="Enter Test ID"
                required
              />
            </div>
            <button type="submit" className="fetch-butto==">
              Fetch Results
            </button>
          </form>

          {message && <p className="feedback-message">{message}</p>}

          {results.length > 0 && (
            <div className="results-container">
              <h3>Results</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Reference Answer</th>
                    <th>Grammar Score</th>
                    <th>Similarity Score</th>
                    <th>Keyword Score</th>
                    <th>LLM Relevance Score</th>
                    <th>Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.question || "N/A"}</td>
                      <td>{result.user_answer || "N/A"}</td>
                      <td>{result.reference_answer || "N/A"}</td>
                      <td>{result.grammar_score}%</td>
                      <td>{result.cosine_similarity_score}%</td>
                      <td>{result.keyword_score}%</td>
                      <td>{result.llm_relevance_score}%</td>
                      <td>{result.total_score.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ViewResultPage;
