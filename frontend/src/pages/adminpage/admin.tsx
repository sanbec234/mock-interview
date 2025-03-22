// AdminPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate("/upload");
  };

  const handleViewClick = () => {
    navigate("/question");
  };

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

  const handleDownloadClick = async () => {
    try {
      const response = await fetch("http://localhost:5000/download_csv");
      if (!response.ok) {
        throw new Error("Failed to download CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "history_data.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

  const handleViewStudentsDetails = async () => {
    navigate("/view-students");
  };

  return (
    <div className="admin-container">
      <Header />
      <h1 className="admin-heading">Admin Dashboard</h1>
      <div className="admin-content">
        <div className="admin-image">
          <img src="/admin.jpg" alt="Admin" className="image" />
        </div>

        <div className="admin-actions">
          <button onClick={handleViewStudentsDetails} className="action-button">
            View Students Details
          </button>
          <button onClick={handleUploadClick} className="action-button">
            Upload Questions By CSV File
          </button>
          <button onClick={handleDeleteClick} className="action-button">
            Delete All Questions
          </button>
          <button onClick={handleDownloadClick} className="action-button">
            Download Questions As CSV
          </button>
          <button onClick={handleViewClick} className="action-button">
            View Dataset
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;
