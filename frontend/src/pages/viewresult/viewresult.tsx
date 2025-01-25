import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./../../components/Header/Header";
import Footer from "./../../components/Footer/Footer";
import "./view-result-page.css"; // Custom CSS for the result page

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
      const response = await fetch("http://localhost:5000/viewresult", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testid: testId }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.result);
        setMessage(null);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to fetch results."}`);
      }
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const goToHomePage = () => {
    navigate("/");
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
            <button type="submit" className="fetch-button">
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
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td>{result.question || "N/A"}</td>
                      <td>{result.answer || "N/A"}</td>
                      <td>{result.reference_answer || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button className="home-button" onClick={goToHomePage}>
            Go to Home Page
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ViewResultPage;
