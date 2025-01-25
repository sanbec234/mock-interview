import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  // Function to handle the "Upload" button click
  const handleUploadClick = () => {
    navigate('/upload'); // Navigate to the upload page
  };

  const handleViewClick = () => {
    navigate('/question'); // Navigate to the upload page
  };

  // Function to handle the "Delete" button click
  const handleDeleteClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Deleted successfully!");
      } else {
        alert("Failed to delete.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Function to handle the "Download" button click (CSV download)
  const handleDownloadClick = async () => {
    try {
      const response = await fetch('http://localhost:5000/download_csv');
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'history_data.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };
  
  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      <div className="admin-actions">
        <button onClick={handleUploadClick} className="action-button">
          Upload
        </button>
        <button onClick={handleDeleteClick} className="action-button">
          Delete
        </button>
        <button onClick={handleDownloadClick} className="action-button">
          Download CSV
        </button>
        <button onClick={handleViewClick} className="action-button">
          View Dataset
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
