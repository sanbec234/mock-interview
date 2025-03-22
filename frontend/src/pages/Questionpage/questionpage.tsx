import React, { useState, useEffect } from "react";
import axios from "axios";
import "./questions_dash.css";

interface Record {
  id: number;
  question: string;
  answer: string;
  keyword: string;
  difficulty_level: string;
  subject: string;
  subtopic: string;
  count: number;
}

const Questions_dash: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [newRecord, setNewRecord] = useState<Partial<Record>>({
    question: "",
    answer: "",
    keyword: "",
    difficulty_level: "",
    subject: "",
    subtopic: "",
    count: 0,
  });
  const [filter, setFilter] = useState({ field: "", value: "" });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/records");
      setRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
      setError("Failed to fetch records. Please try again.");
    }
  };

  const handleAdd = async () => {
    const requiredFields = ["question", "answer", "keyword", "difficulty_level", "subject", "subtopic"];
    const missingFields = requiredFields.filter((field) => !newRecord[field as keyof Record]);
    if (missingFields.length > 0) {
      setError(`The following fields cannot be empty: ${missingFields.join(", ")}`);
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5000/api/records", newRecord);
      setSuccess("Question added successfully!");
      setError("");
      setNewRecord({
        question: "",
        answer: "",
        keyword: "",
        difficulty_level: "",
        subject: "",
        subtopic: "",
        count: 0,
      });
      fetchRecords();
    } catch (error) {
      console.error("Error adding record:", error);
      setError("Failed to add the record. Please try again.");
      setSuccess("");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/records/${id}`);
      setSuccess("Record deleted successfully!");
      setError("");
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      setError("Failed to delete the record. Please try again.");
      setSuccess("");
    }
  };

  const handleFilter = async () => {
    if (!filter.field || !filter.value) {
      setError("Please select a field and enter a value to filter.");
      return;
    }
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/records/filter`, {
        params: filter,
      });
      setRecords(response.data);
      setSuccess("Filter applied successfully!");
      setError("");
    } catch (error) {
      console.error("Error filtering records:", error);
      setError("Failed to apply filter. Please try again.");
      setSuccess("");
    }
  };

  return (
    <div className="container">
      <h1>SQL Data Viewer</h1>

      {/* Add New Question Form */}
      <div className="add-form">
        <h2>Add New Question</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <input
          type="text"
          placeholder="Question"
          value={newRecord.question || ""}
          onChange={(e) => setNewRecord({ ...newRecord, question: e.target.value })}
        />
        <input
          type="text"
          placeholder="Answer"
          value={newRecord.answer || ""}
          onChange={(e) => setNewRecord({ ...newRecord, answer: e.target.value })}
        />
        <input
          type="text"
          placeholder="Keyword"
          value={newRecord.keyword || ""}
          onChange={(e) => setNewRecord({ ...newRecord, keyword: e.target.value })}
        />
        <input
          type="text"
          placeholder="Difficulty Level"
          value={newRecord.difficulty_level || ""}
          onChange={(e) => setNewRecord({ ...newRecord, difficulty_level: e.target.value })}
        />
        <input
          type="text"
          placeholder="Subject"
          value={newRecord.subject || ""}
          onChange={(e) => setNewRecord({ ...newRecord, subject: e.target.value })}
        />
        <input
          type="text"
          placeholder="Subtopic"
          value={newRecord.subtopic || ""}
          onChange={(e) => setNewRecord({ ...newRecord, subtopic: e.target.value })}
        />
        <input
          type="number"
          placeholder="Count (optional)"
          value={newRecord.count || 0}
          onChange={(e) => setNewRecord({ ...newRecord, count: parseInt(e.target.value) })}
        />
        <button onClick={handleAdd}>Add Question</button>
      </div>

      {/* Filter Section */}
      <div className="filter">
        <h2>Filter Records</h2>
        <select onChange={(e) => setFilter({ ...filter, field: e.target.value })}>
          <option value="">Select Field</option>
          <option value="question">Question</option>
          <option value="answer">Answer</option>
          <option value="keyword">Keyword</option>
          <option value="difficulty_level">Difficulty Level</option>
          <option value="subject">Subject</option>
          <option value="subtopic">Subtopic</option>
        </select>
        <input
          type="text"
          placeholder="Filter value"
          onChange={(e) => setFilter({ ...filter, value: e.target.value })}
        />
        <button onClick={handleFilter}>Apply Filter</button>
      </div>

      {/* Records Table */}
      <div className="table-scrollable">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Keyword</th>
              <th>Difficulty Level</th>
              <th>Subject</th>
              <th>Subtopic</th>
              <th>Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.question}</td>
                <td>{record.answer}</td>
                <td>{record.keyword}</td>
                <td>{record.difficulty_level}</td>
                <td>{record.subject}</td>
                <td>{record.subtopic}</td>
                <td>{record.count}</td>
                <td>
                  <button onClick={() => handleDelete(record.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Questions_dash;
