import React, { useState } from "react";
import Papa from "papaparse";
import "./Upload.css"; // Add CSS for styling

const UploadCsv = () => {
  const [processedData, setProcessedData] = useState([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setError("Please select a file.");
      return;
    }

    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log("Parsed data:", result.data); // Check parsed data

        const parsedData = result.data.filter((row) => {
          // Filter out empty rows
          return row.Question && row.Answer && row.Difficultylevel && row.Keyword && row.Subject && row.Subtopic;
        });

        // Normalize field names (Trim any extra whitespace)
        const normalizedData = parsedData.map((row) => ({
          Question: row['Question']?.trim(),
          Answer: row['Answer']?.trim(),
          Keyword: row['Keyword']?.trim(),
          Subject: row['Subject']?.trim(),
          Subtopic: row['Subtopic']?.trim(),
          Difficultylevel: row['Difficultylevel']?.trim(),
        }));

        // Validate the data - Check for missing or empty fields
        const isValid = normalizedData.every((row, index) => {
          const missingFields = [];

          if (!row.Question) missingFields.push('Question');
          if (!row.Answer) missingFields.push('Answer');
          if (!row.Difficultylevel) missingFields.push('Difficultylevel');
          if (!row.Keyword) missingFields.push('Keyword');
          if (!row.Subject) missingFields.push('Subject');
          if (!row.Subtopic) missingFields.push('Subtopic');

          if (missingFields.length > 0) {
            console.log(`Row ${index + 1} is missing: ${missingFields.join(", ")}`);
          }

          return missingFields.length === 0; // Return false if any fields are missing
        });

        if (!isValid) {
          setError("Some fields are missing in the uploaded CSV.");
          return;
        }

        setError(""); // Reset error message
        setProcessedData(normalizedData); // Save normalized data
      },
      error: (err) => {
        setError("Error reading file: " + err.message);
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!processedData.length) {
      alert("No data to upload. Please upload a valid CSV file.");
      return;
    }

    console.log("Data being sent to backend:", processedData); // Debugging: Check data before sending

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: processedData }),
      });

      const result = await response.json();

      if (response.status === 200) {
        alert("Data uploaded successfully!");
        setFileName("");
        setProcessedData([]);
      } else {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Failed to upload data: " + err.message);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Your Question Bank</h1>
      <div className="upload-box">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="file-input"
        />
        {fileName && <p className="file-name">Selected File: {fileName}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>

      {processedData.length > 0 && (
        <div className="preview">
          <h2>Preview of Uploaded Data</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Keyword</th>
                <th>Subject</th>
                <th>Subtopic</th>
                <th>Difficulty level</th>
              </tr>
            </thead>
            <tbody>
              {processedData.slice(0, 5).map((row, index) => (
                <tr key={index}>
                  <td>{row.Question}</td>
                  <td>{row.Answer}</td>
                  <td>{row.Keyword}</td>
                  <td>{row.Subject}</td>
                  <td>{row.Subtopic}</td>
                  <td>{row.Difficultylevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Showing first 5 rows for preview...</p>
        </div>
      )}

      <button onClick={handleSubmit} className="submit-button">
        Submit Data
      </button>
    </div>
  );
};

export default UploadCsv;
