import React, { useState } from 'react';
import Header from '../components/Header/Header.tsx';
import Footer from '../components/Footer/Footer.tsx';
import './../home-page/homepage.css'; // Import the global styles for App

const HomePage: React.FC = () => {
  const [answer, setAnswer] = useState<string>('');  // State for the answer text
  const [question, setQuestion] = useState<string>('What is your favorite color?');  // State for the question

  // Handle the text change in the answer textbox
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value);
  };

  // Handle the "Send" button click
  const handleSend = () => {
    alert(`Answer sent: ${answer}`);
    // You can replace the alert with any function to handle sending the answer
  };

  return (
    <div className="App">
      <Header />
      <div className='main-content'>
        <div className="question-window">
          <h2>{question}</h2>
        </div>
        <div className="response-container">
          <input
            type="text"
            value={answer}
            onChange={handleAnswerChange}
            className="answer-textbox"
            placeholder="Type your answer here..."
          />
          <button onClick={handleSend} className="send-button">Send</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
