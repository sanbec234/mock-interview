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
      <div className="dashboard-content">
        <div className="dashboard-image">
          <img src="/BACK2.jpg" alt="Visual Representation" className="question-image" />
        </div>

        {/* Right Side - Buttons */}
        <div className="dashboard-container">
          <h2 className="fade-in">Student Dashboard</h2>
          <div className="dashboard-buttons">
            <button
              type="button"
              onClick={() => navigate('/collect-details-page')}
              className="dashboard-button slide-up"
            >
              Take New Test
            </button>
            <button
              type="button"
              onClick={() => navigate('/resultlist')}
              className="dashboard-button slide-up"
            >
              View Result
            </button>
          </div>
        </div>
      </div>
      <Footer /> {/* Custom Footer component */}
    </div>
  );
};

export default Dashboard;
