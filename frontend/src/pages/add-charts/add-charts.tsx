import React from "react";
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

const data = {
  evaluations: [
    {
      cosine_similarity_score: 0.49,
      difficulty: "Medium",
      total_score: 1.6125,
      subject: "Computer Networks",
    },
    {
      cosine_similarity_score: 0.29,
      difficulty: "Medium",
      total_score: 1.0625,
      subject: "Computer Networks",
    },
    {
      cosine_similarity_score: 0.43,
      difficulty: "Medium",
      total_score: 1.3575,
      subject: "Computer Networks",
    },
    {
      cosine_similarity_score: 0.32,
      difficulty: "Easy",
      total_score: 1.58,
      subject: "Data Structures and Algorithms",
    },
    {
      cosine_similarity_score: 0.34,
      difficulty: "Easy",
      total_score: 1.435,
      subject: "Data Structures and Algorithms",
    },
  ],
};

const evaluations = data.evaluations ?? [];

// Bar chart: Aggregate scores by subject
const subjectScores = evaluations.reduce<{ [key: string]: number }>(
  (acc, curr) => {
    acc[curr.subject] = (acc[curr.subject] || 0) + curr.total_score;
    return acc;
  },
  {}
);

const barChartData = Object.entries(subjectScores).map(
  ([subject, total_score]) => ({
    subject,
    total_score,
  })
);

// Pie chart: Count occurrences of difficulty levels
const difficultyCounts = evaluations.reduce<{ [key: string]: number }>(
  (acc, curr) => {
    acc[curr.difficulty] = (acc[curr.difficulty] || 0) + 1;
    return acc;
  },
  {}
);

const pieChartData = Object.entries(difficultyCounts).map(
  ([difficulty, count]) => ({
    name: difficulty,
    value: count,
  })
);

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const PerformanceCharts: React.FC = () => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <h2 className="text-xl font-bold">Performance Visualization</h2>

      {/* Bar Chart */}
      <BarChart width={500} height={300} data={barChartData}>
        <XAxis dataKey="subject" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total_score" fill="#8884d8" />
      </BarChart>

      {/* Pie Chart */}
      <PieChart width={400} height={400}>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {pieChartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default PerformanceCharts;
