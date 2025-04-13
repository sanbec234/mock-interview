import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  ResponsiveContainer,
} from "recharts";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./completionpage.css";

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
  time_taken: number;
}

interface SubjectPerformance {
  subject: string;
  total_score: number;
}

interface DifficultyDistribution {
  name: string;
  value: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

// Subject abbreviation mapping
const subjectAbbreviations: Record<string, string> = {
  "Computer Networks": "CN",
  "Operating Systems": "OS",
  "Data Structures": "DSA",
  "Database Systems": "DBMS",
  "Object Oriented Programming": "OOP",
};

const CompletionPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);
  const [subjectPerformance, setSubjectPerformance] = useState<
    SubjectPerformance[]
  >([]);
  const [difficultyDistribution, setDifficultyDistribution] = useState<
    DifficultyDistribution[]
  >([]);

  const { testid: paramTestId } = useParams();

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
        const response = await fetch("http://localhost:5001/view_result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testid }),
        });
        const data = await response.json();
        if (response.ok) {
          setEvaluations(data.evaluations);
          setFinalScore(data.final_score);
          setOverallFeedback(data.overall_feedback);
          setTotalTimeTaken(data.total_time_taken);
          setSubjectPerformance(data.subject_performance || []);
          setDifficultyDistribution(data.difficulty_distribution || []);
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const formatOverallFeedback = (feedback: string) => {
    const sections = feedback.split("**");
    return sections.map((section, index) => {
      const points = section.trim().split("*");
      if (section.trim() === "") return null;
      if (index % 2 !== 0) return null;
      return (
        <div key={index} className="feedback-section">
          <h4>{sections[index - 1]?.trim()}</h4>
          <ul>
            {points.map(
              (point, i) => point.trim() && <li key={i}>{point.trim()}</li>
            )}
          </ul>
        </div>
      );
    });
  };
  const formatTimeDisplay = (seconds: number): string => {
    seconds = seconds * 60;
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    return `${Math.floor(seconds)}s`;
  };
  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      "Computer Networks": "#FFD700",
      "Operating Systems": "#FFA500",
      "Data Structures and Algorithms": "#FF6347",
      "Database Systems": "#20B2AA",
      "Object Oriented Programming": "#9370DB",
    };
    return colors[subject] || "#6495ED";
  };

  // Format subject names for the bar chart
  const formatSubjectName = (subject: string) => {
    return (
      subjectAbbreviations[subject] || subject.substring(0, 3).toUpperCase()
    );
  };

  return (
    <div className="completion-page">
      <Header />
      <div className="completion-container">
        {/* Performance Summary Section */}
        <div className="performance-summary">
          <div className="score-card">
            <p className="score-label2">Overall Score</p>
            <h2 className="final-score">{finalScore}%</h2>
            <div className="time-taken">
              <span className="time-icon">⏱️</span>

              <span>{formatTimeDisplay(totalTimeTaken)}</span>
            </div>
          </div>

          <div className="feedback-card">
            <h3>Performance Summary</h3>
            <div className="feedback-content">
              {formatOverallFeedback(overallFeedback)}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <h2 className="section-title">Performance Analysis</h2>
          <div className="charts-grid">
            {subjectPerformance.length > 0 && (
              <div className="chart-card">
                <h3>Subject Performance</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectPerformance}>
                      <XAxis
                        dataKey="subject"
                        tickFormatter={formatSubjectName}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Score"]}
                        labelFormatter={(label) => `Subject: ${label}`}
                      />
                      <Bar
                        dataKey="total_score"
                        name="Score"
                        fill="#4a6bdf"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {difficultyDistribution.length > 0 && (
              <div className="chart-card">
                <h3>Difficulty Distribution</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={difficultyDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={60}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {difficultyDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} questions`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Evaluations Section */}
        <div className="evaluations-section">
          <h2 className="section-title">Question-wise Evaluation</h2>
          <div className="evaluations-list">
            {evaluations.map((evaluation, index) => (
              <div key={index} className="evaluation-card">
                <div className="question-header">
                  <div className="question-meta">
                    <span className="question-number">
                      Question {index + 1}
                    </span>
                    <span
                      className="difficulty-badge"
                      style={{
                        backgroundColor:
                          evaluation.difficulty?.toLowerCase() === "easy"
                            ? "#4CAF50"
                            : evaluation.difficulty?.toLowerCase() === "hard"
                            ? "#F44336"
                            : "#FF9800",
                      }}
                    >
                      {evaluation.difficulty || "Unknown"}
                    </span>
                    <span
                      className="subject-badge"
                      style={{
                        backgroundColor: getSubjectColor(evaluation.subject),
                      }}
                    >
                      {evaluation.subject}
                    </span>
                  </div>
                  <h3 className="question-text">{evaluation.question}</h3>
                  <p className="subtopic">
                    <strong>Sub-Topic:</strong> {evaluation.subtopic}
                  </p>
                </div>

                <div className="answer-section">
                  <div className="answer-card">
                    <h4>Your Answer</h4>
                    <p>{evaluation.user_answer}</p>
                  </div>
                  <div className="answer-card reference">
                    <h4>Reference Answer</h4>
                    <p>{evaluation.reference_answer}</p>
                  </div>
                </div>

                <div className="explanation-card">
                  <h4>Explanation</h4>
                  <p>{evaluation.explanation}</p>
                </div>

                <div className="scores-section">
                  <div className="score-item">
                    <span className="score-label">Grammar</span>
                    <span className="score-value">
                      {evaluation.grammar_score}%
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Similarity</span>
                    <span className="score-value">
                      {evaluation.cosine_similarity_score}%
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Keywords</span>
                    <span className="score-value">
                      {evaluation.keyword_score}%
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Relevance</span>
                    <span className="score-value">
                      {evaluation.llm_relevance_score}%
                    </span>
                  </div>
                  <div className="score-item total">
                    <span className="score-label">Total</span>
                    <span className="score-value">
                      {evaluation.total_score}%
                    </span>
                  </div>
                  <div className="score-item time">
                    <span className="time-icon">⏱️</span>
                    <span className="score-value">
                      {formatTimeDisplay(evaluation.time_taken)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompletionPage;
