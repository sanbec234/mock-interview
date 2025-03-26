import React, { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./result-list-page.css";
import { useNavigate } from "react-router-dom";

type Test = {
  test_id: number;
  created_at: string;
  topics: string;
};

type TestData = {
  incomplete_tests: Test[];
  tests_with_pending_results: Test[];
  tests_with_results: Test[];
};

const ResultListPage: React.FC = () => {
  const [testData, setTestData] = useState<TestData>({
    incomplete_tests: [],
    tests_with_pending_results: [],
    tests_with_results: [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("incomplete");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchTestData = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) {
          if (isMounted) setMessage("Email not found. Please log in.");
          return;
        }

        const response = await fetch("http://localhost:5000/resultlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (isMounted) {
          if (response.ok) {
            const data: Partial<TestData> = await response.json();
            setTestData({
              incomplete_tests: data.incomplete_tests ?? [],
              tests_with_pending_results: data.tests_with_pending_results ?? [],
              tests_with_results: data.tests_with_results ?? [],
            });
          } else {
            const error = await response.json();
            setMessage(`Error: ${error.error || "Failed to fetch test data."}`);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch Test Data Error:", err);
          setMessage(`Error: ${err.message || "Something went wrong."}`);
        }
      }
    };

    fetchTestData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = async (testId: number, action: string) => {
    if (action === "view_result") {
      localStorage.setItem("test_id", testId.toString());
      navigate("/completion-page");
    } else if (action === "check_result") {
      try {
        const response = await fetch("http://localhost:5000/check_result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId }),
        });

        if (response.ok) {
          const data = await response.json();
          const overallFeedback = data.overall_feedback || "No feedback available.";

          alert(`Test Evaluated! Feedback: ${overallFeedback}`);

          setTestData((prev) => {
            const pendingTests = prev.tests_with_pending_results.filter(
              (test) => test.test_id !== testId
            );
            const evaluatedTest = prev.tests_with_pending_results.find(
              (test) => test.test_id === testId
            );

            if (evaluatedTest) {
              return {
                ...prev,
                tests_with_pending_results: pendingTests,
                tests_with_results: [...prev.tests_with_results, evaluatedTest],
              };
            }

            return prev;
          });
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || "Failed to evaluate the test."}`);
        }
      } catch (err) {
        console.error("Error evaluating test:", err);
        alert("An error occurred while evaluating the test.");
      }
    } else if (action === "resume") {
      try {
        const response = await fetch("http://localhost:5000/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Resume Test Data:", data);
          localStorage.setItem("resume_test_data", JSON.stringify(data));
          navigate("/home");
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || "Failed to resume the test."}`);
        }
      } catch (err) {
        console.error("Error resuming test:", err);
        alert("An error occurred while resuming the test.");
      }
    }
  };

  const renderTests = () => {
    let tests: Test[] = [];
    let actionLabel = "";
    let actionType = "";

    if (activeTab === "incomplete") {
      tests = testData.incomplete_tests;
      actionLabel = "Resume your Test";
      actionType = "resume";
    } else if (activeTab === "pending") {
      tests = testData.tests_with_pending_results;
      actionLabel = "Check Result";
      actionType = "check_result";
    } else {
      tests = testData.tests_with_results;
      actionLabel = "View Result";
      actionType = "view_result";
    }

    return tests.length > 0 ? (
      <table className="test-table">
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Topics</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr key={test.test_id}>
              <td>{test.test_id}</td>
              <td>{test.topics}</td>
              <td>{test.created_at}</td>
              <td>
                <button
                  onClick={() => handleAction(test.test_id, actionType)}
                  className="action-button"
                >
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>No {activeTab} tests available.</p>
    );
  };

  return (
    <div className="App">
      <Header />
      <div className="result-container">
        <h2>Test Status</h2>
        {message && <p className="feedback-message">{message}</p>}

        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === "incomplete" ? "active" : ""}`}
            onClick={() => setActiveTab("incomplete")}
          >
            Incomplete Tests
          </button>
          <button
            className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Tests
          </button>
          <button
            className={`tab-button ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
          >
            Results
          </button>
        </div>

        <div className="test-list">{renderTests()}</div>
      </div>
      <Footer />
    </div>
  );
};

export default ResultListPage;