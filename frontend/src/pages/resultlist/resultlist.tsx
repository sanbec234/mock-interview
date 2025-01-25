import React, { useEffect, useState } from "react";
import Header from "./../../components/Header/Header";
import Footer from "./../../components/Footer/Footer";
import "./result-list-page.css";
import { useNavigate } from "react-router-dom";

const ResultListPage: React.FC = () => {
  interface TestData {
    incomplete_tests: number[];
    tests_with_pending_results: number[];
    tests_with_results: number[];
  }

  const [testData, setTestData] = useState<TestData>({
    incomplete_tests: [],
    tests_with_pending_results: [],
    tests_with_results: [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchTestData = async () => {
      try {
        const rollno = localStorage.getItem("userEmail");
        if (!rollno) {
          if (isMounted) setMessage("Roll number not found. Please log in.");
          return;
        }

        const response = await fetch("http://localhost:5000/resultlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rollno }),
        });

        if (isMounted) {
          if (response.ok) {
            const data = await response.json();

            // Ensure `null` values are replaced with empty arrays
            setTestData({
              incomplete_tests: data.incomplete_tests || [],
              tests_with_pending_results: data.tests_with_pending_results || [],
              tests_with_results: data.tests_with_results || [],
            });
          } else {
            const error = await response.json();
            setMessage(`Error: ${error.error || "Failed to fetch test data."}`);
          }
        }
      } catch (err: any) {
        if (isMounted)
          setMessage(`Error: ${err.message || "Something went wrong."}`);
      }
    };

    fetchTestData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = async (testId: number, action: string) => {
    try {
      if (action === "view_result") {
        // Save testId to local storage
        localStorage.setItem("test_id", testId.toString());
        // Navigate to the completion page
        navigate("/completion-page");
        return;
      }

      const endpoint =
        action === "resume"
          ? "http://localhost:5000/resume"
          : action === "check_result"
          ? "http://localhost:5000/check_result"
          : "";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });

      if (response.ok) {
        const result = await response.json();

        if (action === "check_result") {
          if (Array.isArray(result) && result.length > 0) {
            // If check_result succeeds, move the test to 'tests_with_results'
            setTestData((prev) => ({
              ...prev,
              tests_with_pending_results: prev.tests_with_pending_results.filter(
                (id) => id !== testId
              ),
              tests_with_results: [...prev.tests_with_results, testId],
            }));
          } else {
            setMessage("No results available for this test yet.");
          }
        } else {
          setMessage(result.message || "Action completed successfully.");
        }
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "Failed to perform action."}`);
      }
    } catch (err: any) {
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
