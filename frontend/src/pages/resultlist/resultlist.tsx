import React, { useEffect, useState } from "react";
import Header from "./../../components/Header/Header.tsx";
import Footer from "./../../components/Footer/Footer.tsx";
import "./result-list-page.css"; // Custom CSS for styling
import { useNavigate } from "react-router-dom";

const ResultListPage: React.FC = () => {
  const [testData, setTestData] = useState({
    incomplete_tests: [],
    tests_with_pending_results: [],
    tests_with_results: [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const rollno = localStorage.getItem("userEmail");
        if (!rollno) {
          setMessage("Roll number not found. Please log in.");
          return;
        }

        console.log("Sending roll number to API:", rollno);

        const response = await fetch("http://localhost:5000/resultlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ rollno }) // Send rollno in the body
        });

        if (response.ok) {
          const data = await response.json();
          setTestData(data);
        } else {
          const error = await response.json();
          console.error("API Error Response:", error);
          setMessage(`Error: ${error.error || "Failed to fetch test data."}`);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setMessage(`Error: ${err.message || "Something went wrong."}`);
      }
    };

    fetchTestData();
  }, []);

  const handleAction = async (testId: number, action: string) => {
    try {
      const endpoint =
        action === "resume"
          ? "http://localhost:5000/resume"
          : action === "check_result"
          ? "http://localhost:5000/check_result"
          : "http://localhost:5000/view_result";

      console.log(`Action: ${action}, Test ID: ${testId}, Endpoint: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (action === "view_result") {
          navigate("/result-detail-page", { state: { result } });
        } else {
          setMessage(result.message || "Action completed successfully.");
        }
      } else {
        const error = await response.json();
        console.error("Action Error Response:", error);
        setMessage(`Error: ${error.error || "Failed to perform action."}`);
      }
    } catch (err) {
      console.error("Action Error:", err);
      setMessage(`Error: ${err.message || "Something went wrong."}`);
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <h2>Test Status</h2>

        {message && <p className="feedback-message">{message}</p>}

        <div className="test-list">
          <h3>Incomplete Tests</h3>
          {testData.incomplete_tests.length > 0 ? (
            testData.incomplete_tests.map((testId) => (
              <div key={testId} className="test-item">
                <span>Test ID: {testId}</span>
                <button
                  onClick={() => handleAction(testId, "resume")}
                  className="action-button"
                >
                  Resume
                </button>
              </div>
            ))
          ) : (
            <p>No incomplete tests.</p>
          )}

          <h3>Tests with Pending Results</h3>
          {testData.tests_with_pending_results.length > 0 ? (
            testData.tests_with_pending_results.map((testId) => (
              <div key={testId} className="test-item">
                <span>Test ID: {testId}</span>
                <button
                  onClick={() => handleAction(testId, "check_result")}
                  className="action-button"
                >
                  Check Result
                </button>
              </div>
            ))
          ) : (
            <p>No tests with pending results.</p>
          )}

          <h3>Tests with Results</h3>
          {testData.tests_with_results.length > 0 ? (
            testData.tests_with_results.map((testId) => (
              <div key={testId} className="test-item">
                <span>Test ID: {testId}</span>
                <button
                  onClick={() => handleAction(testId, "view_result")}
                  className="action-button"
                >
                  View Result
                </button>
              </div>
            ))
          ) : (
            <p>No tests with results.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResultListPage;
