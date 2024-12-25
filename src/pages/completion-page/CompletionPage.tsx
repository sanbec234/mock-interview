import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Use useNavigate instead of useHistory
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import './../completion-page/completionpage.css';

const CompletionPage: React.FC = () => {
  const [message, setMessage] = useState<string>(''); // State to hold the completion message
  const navigate = useNavigate(); // Hook for redirection

  // Fetch the completion status and message from the backend
  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        const statusResponse = await fetch('http://localhost:5000/completion-status');
        const statusData = await statusResponse.json();

        if (statusData.completed) {
          // If the test is completed, fetch the message
          const response = await fetch('http://localhost:5000/completion-page');
          const data = await response.json();
          setMessage(data.message); // Set the completion message
        } else {
          // Redirect to start page if the test is not completed
          navigate('/start-test');
        }
      } catch (error) {
        console.error('Error checking completion status:', error);
        // Handle error if necessary
      }
    };

    checkCompletionStatus();
  }, [navigate]); // Depend on `navigate`

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="question-window">
          <h2>{message}</h2> {/* Display the message from backend */}
        </div>
        <div className="completion-message">
          <p>Your responses have been recorded successfully. You will be redirected shortly.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompletionPage;