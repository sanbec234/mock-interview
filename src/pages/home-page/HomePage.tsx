import React, { useState, useRef } from 'react';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import { sendAnswerToBackend } from '../../utils/api.js'; // Import the API logic
import './homepage.css'; // Import the global styles for App

const HomePage: React.FC = () => {
  const [answer, setAnswer] = useState<string>(''); // State for the answer text
  const [question, setQuestion] = useState<string>('Are you ready?'); // State for the question
  const [isListening, setIsListening] = useState<boolean>(false); // State to track if the mic is active
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // State to manage the "Send" button status
  const recognitionRef = useRef<any>(null); // Ref to store the SpeechRecognition instance

  // Initialize SpeechRecognition only once
  if (!recognitionRef.current && 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true; // Allow continuous speech

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      setAnswer((prevAnswer) => prevAnswer + ' ' + transcript); // Append the recognized speech to existing text
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition; // Store the instance
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop(); // Stop recognition if already listening
    } else {
      recognitionRef.current.start(); // Start recognition if not listening
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value); // Allow manual editing of the text box
  };

  const handleSend = async () => {
    if (isSubmitting) return; // Prevent further clicks if submitting

    if (answer.trim() === '') {
      alert('Please enter an answer or type "N/A" if you don\'t know the answer.');
      return;
    }

    setIsSubmitting(true); // Set submitting state to true to disable the button
    try {
      const nextQuestion = await sendAnswerToBackend(answer); // Call the utility function
      setQuestion(nextQuestion); // Update the question
      setAnswer(''); // Clear the answer field
    } catch (error) {
      console.error('Error sending answer:', error);
    } finally {
      setIsSubmitting(false); // Set submitting state back to false after processing
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
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
          <button
            className={`mic-button ${isListening ? 'active' : ''}`}
            title={isListening ? 'Click to stop recording' : 'Click to start recording'}
            onClick={handleMicClick}
          >
            🎤
          </button>
          <button
            onClick={handleSend}
            className="send-button"
            disabled={isSubmitting} // Disable the button if submitting
          >
            Send
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;