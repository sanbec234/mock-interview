import React, { useState, useRef, useEffect } from 'react';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import { sendAnswerToBackend } from '../../utils/api.js'; 
import './homepage.css'; 

const HomePage: React.FC = () => {
  const [answer, setAnswer] = useState<string>(''); 
  const [question, setQuestion] = useState<string>('Are you ready?'); 
  const [isListening, setIsListening] = useState<boolean>(false); 
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); 
  const [isTTSenabled, setIsTTSenabled] = useState<boolean>(true); 
  const recognitionRef = useRef<any>(null); 

  
  if (!recognitionRef.current && 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true; 

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
      setAnswer((prevAnswer) => prevAnswer + ' ' + transcript); 
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition; 
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop(); 
    } else {
      recognitionRef.current.start(); 
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value); 
  };

  const handleSend = async () => {
    if (isSubmitting) return; 

    if (answer.trim() === '') {
      alert('Please enter an answer or type "N/A" if you don\'t know the answer.');
      return;
    }

    setIsSubmitting(true); 
    try {
      const nextQuestion = await sendAnswerToBackend(answer); 
      setQuestion(nextQuestion); 
      setAnswer(''); 
    } catch (error) {
      console.error('Error sending answer:', error);
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleTextToSpeech = () => {
    if (isTTSenabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question); 
      utterance.lang = 'en-US'; 
      speechSynthesis.speak(utterance); 
    } else if (!isTTSenabled) {
      alert('Text-to-Speech is currently disabled.');
    } else {
      alert('Text-to-Speech is not supported in this browser.');
    }
  };

  const toggleTTS = () => {
    setIsTTSenabled((prev) => !prev); 
  };

  
  useEffect(() => {
    if (isTTSenabled) {
      handleTextToSpeech(); 
    }
  }, [question, isTTSenabled, handleTextToSpeech]); 

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="question-window">
          <h2>{question}</h2>
          <button
            className="tts-button"
            onClick={handleTextToSpeech}
            title={isTTSenabled ? 'Click to hear the question' : 'TTS is disabled'}
            disabled={!isTTSenabled} 
          >
            🔊
          </button>
          <div className="tts-toggle">
            <label>
              Text-to-speech:
              <input
                type="checkbox"
                checked={isTTSenabled}
                onChange={toggleTTS}
              />
            </label>
          </div>
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
            disabled={isSubmitting} 
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