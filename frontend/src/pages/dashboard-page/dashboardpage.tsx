import React from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import './dashboard.css'; // Custom CSS for styling
import Header from './../../components/Header/Header'; // Header component
import Footer from './../../components/Footer/Footer'; // Footer component

const Dashboard: React.FC = () => {
  const navigate = useNavigate(); // Initialize the useNavigate hook

  return (
    <div className="dashboard-page">
      <Header /> {/* Custom Header component */}
      <div className="dashboard-container">
        <h2>Dashboard</h2>
        <div className="dashboard-buttons">
          <button
            type="button"
            onClick={() => navigate('/collect-details-page')} // Redirect to Take New Test page
            className="dashboard-button"
          >
            Take New Test
          </button>
          <button
            type="button"
            onClick={() => navigate('/resultlist')} // Redirect to View Result page
            className="dashboard-button"
          >
            View Result
          </button>
        </div>
      </div>
      <Footer /> {/* Custom Footer component */}
    </div>
  );
};

export default Dashboard;
