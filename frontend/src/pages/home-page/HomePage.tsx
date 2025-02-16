import React, { useState, useEffect, useRef } from "react";
import Header from "./../../components/Header/Header";
import Footer from "./../../components/Footer/Footer";
import "./homepage.css";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const [questions, setQuestions] = useState<
    { id: number; question: string }[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answer, setAnswer] = useState<string>(""); // Current answer text
  const [answers, setAnswers] = useState<{ id: number; answer: string }[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTTSActive, setIsTTSActive] = useState<boolean>(true); 
  const [hasSpoken, setHasSpoken] = useState<boolean>(false); 
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      const email = localStorage.getItem("userEmail"); // Get user email from localStorage
      const numQuestions = localStorage.getItem("numQuestions"); // Number of questions from DetailsPage
      const selectedTopics = JSON.parse(
        localStorage.getItem("selectedTopics") || "[]"
      ); // Selected topics from DetailsPage

      if (!email || !numQuestions || selectedTopics.length === 0) {
        alert(
          "Required details are missing. Please go back to the details page."
        );
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/start_test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            numQuestions: parseInt(numQuestions),
            selectedTopics,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setQuestions(data.questions || []);
          localStorage.setItem("test_id", data.test_id); // Store test ID in localStorage
        } else {
          console.error("Failed to fetch questions");
          alert("Failed to fetch questions. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        alert("An error occurred while fetching questions.");
      }
    };

    fetchQuestions();
  }, []);

  // Initialize speech recognition
  if (!recognitionRef.current && "webkitSpeechRecognition" in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
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
        .join(" ");
      setAnswer((prev) => prev + " " + transcript); // Append recognized speech to the answer
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition; // Save the instance
  }

  
  const speakText = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  useEffect(() => {
    if (isTTSActive && questions.length > 0 && !hasSpoken) {
      speakText(questions[currentQuestionIndex].question);
      setHasSpoken(true); 
    }
  }, [currentQuestionIndex, questions, isTTSActive, hasSpoken]);
  

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleAnswerSubmit = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (!navigator.onLine) {
      alert("Internet not connected. Please re-submit your answers.");
      return;
    } 

    if (answer.trim() === "") {
      alert("Please provide an answer before moving to the next question.");
      return;
    }

    // Save the current answer
    setAnswers((prev) => [...prev, { id: currentQuestion.id, answer }]);
    setAnswer(""); // Clear the current answer input

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1); // Move to the next question
      setHasSpoken(false);
    } else {
      // All questions answered, submit answers to backend
      submitAnswersToBackend();
    }
  };

  const submitAnswersToBackend = async () => {
    const rollno = localStorage.getItem("userEmail");
    const test_id = localStorage.getItem("test_id");

    try {
      const response = await fetch("http://127.0.0.1:5000/submit_answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollno,
          testid: test_id,
          answers,
        }),
      });

      if (response.ok) {
        alert("Answers submitted successfully!");
        navigate("/dashborad"); // Navigate to the dashboard
      } else {
        console.error("Failed to submit answers");
        alert("Failed to submit answers. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("An error occurred while submitting answers.");
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        {questions.length > 0 ? (
          <div className="question-container">
            <h2>Question {currentQuestionIndex + 1}</h2>
            <p>{questions[currentQuestionIndex].question}</p>

            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="answer-textbox"
              placeholder="Type your answer here..."
            />

<button
  onClick={() => {
    speakText(questions[currentQuestionIndex].question);
  }}
  className="speaker-button"
>
  <span role="img" aria-label="Speaker">🔊</span>
</button>

            <div className="controls">
              <button
                className={`mic-button ${isListening ? "active" : ""}`}
                title={
                  isListening
                    ? "Click to stop recording"
                    : "Click to start recording"
                }
                onClick={handleMicClick}
              >
                <span role="img" aria-label="Microphone">
                  🎤
                </span>
              </button>
              <button onClick={handleAnswerSubmit} className="submit-button">
                {currentQuestionIndex === questions.length - 1
                  ? "Finish Test"
                  : "Next Question"}
              </button>
              <br></br>
              <button
                onClick={() => setIsTTSActive(!isTTSActive)}
                className="tts-toggle-button"
              >
                  {isTTSActive ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
              </button>
            </div>
          </div>
        ) : (
          <p>Loading questions...</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
