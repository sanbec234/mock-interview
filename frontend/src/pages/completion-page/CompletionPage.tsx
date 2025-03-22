import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./completionpage.css";
import loadingGif from "../../Loading_2.gif"; // Import the GIF

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

const staticSubjectScores = [
  { subject: "Computer networks ", total_score: 85 },
  { subject: "Data structures", total_score: 75 },
  { subject: "OOPS", total_score: 90 },
  { subject: "DBMS", total_score: 80 },
  { subject: "Operating System", total_score: 70 },
];

const staticPieData = [
  { name: "Easy", value: 5 },
  { name: "Medium", value: 10 },
  { name: "Hard", value: 3 },
];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const CompletionPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const paramTestId = location.state?.test; // Retrieve test value
  console.log(paramTestId);

  useEffect(() => {
    const fetchCompletionData = async () => {
      const storedTestId = localStorage.getItem("test_id");
      const testid = paramTestId || storedTestId;
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
          setError(data.error || "Failed to load completion data.");
        }
      } catch (err) {
        setError("Failed to load completion data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompletionData();
  }, [paramTestId]);

  if (loading)
    return (
      <div className="loading">
        <img src={loadingGif} alt="Loading..." height="150px" width="150px" />
      </div>
    );
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="App">
      <Header />
      <div className="cmain-content two-column-layout">
        <div className="charts-column">
          <h2>Performance Analysis</h2>
          <div className="chart-container">
            <h3>Subject Total Scores</h3>
            <BarChart width={500} height={300} data={staticSubjectScores}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_score" fill="#8884d8" />
            </BarChart>
          </div>
          <div className="chart-container">
            <h3>Difficulty Distribution</h3>
            <PieChart width={400} height={400}>
              <Pie
                data={staticPieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
              >
                {staticPieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
        <div className="evaluations-column">
          <h3>Score:45.55%</h3>
          <h5>Overall Score: {finalScore}</h5>
          {evaluations.map((evaluation, index) => (
            <div key={index} className="evaluation">
              <div>
                <span className="subject">{evaluation.subject}</span>
                <span className="subtopic">{evaluation.subtopic}</span>
                <span
                  className="difficulty"
                  // style={{
                  //   backgroundColor:
                  //     evaluation.difficulty?.toLowerCase() === "easy"
                  //       ? "green"
                  //       : evaluation.difficulty?.toLowerCase() === "hard"
                  //       ? "red"
                  //       : "yellow",
                  // }}
                >
                  {/* {evaluation.difficulty || "Unknown"} */}
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
                <strong>Total Score:</strong> {evaluation.total_score}
              </p>
              <hr />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompletionPage;
