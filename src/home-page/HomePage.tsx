import React, { useState, useRef } from 'react';
import Header from '../components/Header/Header.tsx';
import Footer from '../components/Footer/Footer.tsx';
import './../home-page/homepage.css'; // Import the global styles for App

const HomePage: React.FC = () => {
  const [answer, setAnswer] = useState<string>(''); // State for the answer text
  const [question, setQuestion] = useState<string>('What is your favorite color?'); // State for the question
  const [isListening, setIsListening] = useState<boolean>(false); // State to track if the mic is active
  const recognitionRef = useRef<any>(null); // Ref to store the SpeechRecognition instance

  // Initialize SpeechRecognition only once
  if (!recognitionRef.current && 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true; // Allow continuous speech

    recognition.onstart = () => {
      console.log('Speech recognition started.');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      console.log('Recognized speech:', transcript); // Log the speech to the console
      setAnswer((prevAnswer) => prevAnswer + ' ' + transcript); // Append the recognized speech to existing text
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
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

  const handleSend = () => {
    alert(`Answer sent: ${answer}`);
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
            className={`mic-button ${isListening ? 'active' : ''}`} // Add 'active' class while listening
            title={isListening ? 'Click to stop recording' : 'Click to start recording'}
            onClick={handleMicClick}
          >
            🎤
          </button>
          <button onClick={handleSend} className="send-button">
            Send
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
