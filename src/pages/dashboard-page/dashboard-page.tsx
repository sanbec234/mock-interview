import React from 'react';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import './dashboard-page.css'; // Custom CSS for dashboard

const DashboardPage: React.FC = () => {
  const handleTakeTest = () => {
    console.log('Take Test button clicked!');
    // Add logic to navigate to the test page
  };

  const handleViewResults = () => {
    console.log('View Results button clicked!');
    // Add logic to navigate to the results page
  };

  return (
    <div className="App">
      <Header />
      <div className="dashboard-container">
        <h1>Welcome to the Dashboard</h1>
        <div className="button-container">
          <button className="dashboard-button" onClick={handleTakeTest}>
            Take Test
          </button>
          <button className="dashboard-button" onClick={handleViewResults}>
            View Results
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;
