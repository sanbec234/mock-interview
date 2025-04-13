// import React, { useState, useEffect, useRef } from "react";
// import Header from "./../../components/Header/Header";
// import Footer from "./../../components/Footer/Footer";
// import "./homepage.css";
// import { useNavigate } from "react-router-dom";

// const HomePage: React.FC = () => {
//   const [questions, setQuestions] = useState<
//     { id: number; question: string }[]
//   >([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
//   const [answer, setAnswer] = useState<string>("");
//   const [answers, setAnswers] = useState<
//     { id: number; answer: string; time_taken: number }[]
//   >([]);
//   const [isListening, setIsListening] = useState<boolean>(false);
//   const [isTTSActive, setIsTTSActive] = useState<boolean>(true);
//   const [hasSpoken, setHasSpoken] = useState<boolean>(false);
//   const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
//   const [feedback1, setFeedback1] = useState<string>("");
//   const [feedback2, setFeedback2] = useState<string>("");
//   const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
//   const [selectedVoice, setSelectedVoice] =
//     useState<SpeechSynthesisVoice | null>(null);
//   const [elapsedTime, setElapsedTime] = useState<number>(0); // State to store elapsed time
//   const recognitionRef = useRef<any>(null);
//   const startTimeRef = useRef<number | null>(null); // To track start time for each question
//   const navigate = useNavigate();

//   // Fetch questions from the backend
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       const email = localStorage.getItem("userEmail");
//       // const testId = localStorage.getItem("test_id"); // Fetch the test ID for resuming

//       if (!email) {
//         alert("User email is missing. Please log in again.");
//         navigate("/login"); // Redirect to login if email is missing
//         return;
//       }

//       try {
//         let response;

//         // Check if there is resume_test_data in localStorage
//         const resumeTestData = localStorage.getItem("resume_test_data");
//         if (resumeTestData) {
//           console.log("Resume Test Data Found:", resumeTestData);
//           const data = JSON.parse(resumeTestData);
//           setQuestions(data.questions || []);
//           localStorage.removeItem("resume_test_data"); // Clear the resume data
//           return; // Exit early since we have the resume data
//         } else {
//           // If no testId, start a new test
//           const numQuestions = localStorage.getItem("numQuestions");
//           const selectedTopics = JSON.parse(
//             localStorage.getItem("selectedTopics") || "[]"
//           );

//           if (!numQuestions || selectedTopics.length === 0) {
//             alert(
//               "Required details are missing. Please go back to the details page."
//             );
//             navigate("/dashborad"); // Redirect to details page
//             return;
//           }

//           response = await fetch("http://127.0.0.1:5001/start_test", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               email,
//               numQuestions: parseInt(numQuestions),
//               selectedTopics,
//             }),
//           });
//         }

//         if (response.ok) {
//           const data = await response.json();
//           console.log("Fetched Questions:", data.questions);
//           setQuestions(data.questions || []);
//           console.log(data.test_id);
//           if (data.test_id) {
//             localStorage.setItem("test_id", data.test_id); // Store test ID if starting a new test
//           }
//         } else {
//           console.error("Failed to fetch questions");
//           alert("Failed to fetch questions. Please try again.");
//         }
//       } catch (error) {
//         console.error("Error fetching questions:", error);
//         alert("An error occurred while fetching questions.");
//       }
//     };

//     fetchQuestions();
//   }, []);
//   // Fetch available voices and filter for English voices
//   useEffect(() => {
//     const loadVoices = () => {
//       const availableVoices = window.speechSynthesis.getVoices();

//       // Filter for English voices
//       const englishVoices = availableVoices.filter((voice) =>
//         voice.lang.startsWith("en")
//       );

//       setVoices(englishVoices);

//       // Set a default voice (e.g., the first English voice)
//       if (englishVoices.length > 0) {
//         setSelectedVoice(englishVoices[0]);
//       }
//     };

//     // Load voices when the component mounts
//     loadVoices();

//     // Update voices when the voices change (e.g., when the browser loads more voices)
//     window.speechSynthesis.onvoiceschanged = loadVoices;

//     // Cleanup
//     return () => {
//       window.speechSynthesis.onvoiceschanged = null;
//     };
//   }, []);

//   // Initialize speech recognition
//   if (!recognitionRef.current && "webkitSpeechRecognition" in window) {
//     const SpeechRecognition = (window as any).webkitSpeechRecognition;
//     const recognition = new SpeechRecognition();

//     recognition.lang = "en-US";
//     recognition.interimResults = false;
//     recognition.continuous = true;

//     recognition.onstart = () => {
//       setIsListening(true);
//     };

//     recognition.onend = () => {
//       setIsListening(false);
//     };

//     recognition.onresult = (event: SpeechRecognitionEvent) => {
//       const transcript = Array.from(event.results)
//         .map((result) => result[0].transcript)
//         .join(" ");
//       setAnswer((prev) => prev + " " + transcript);
//     };

//     recognition.onerror = () => {
//       setIsListening(false);
//     };

//     recognitionRef.current = recognition;
//   }

//   // Speak text using the selected voice
//   const speakText = (text: string) => {
//     if (!selectedVoice) return;

//     const speech = new SpeechSynthesisUtterance(text);
//     speech.voice = selectedVoice;
//     speech.lang = selectedVoice.lang;
//     speech.rate = 1; // Adjust speed (0.5 to 2)
//     speech.pitch = 1; // Adjust pitch (0 to 2)
//     window.speechSynthesis.speak(speech);
//   };

//   // Speak the current question when the question changes
//   useEffect(() => {
//     if (isTTSActive && questions.length > 0 && !hasSpoken) {
//       speakText(questions[currentQuestionIndex].question);
//       setHasSpoken(true);
//     }
//   }, [currentQuestionIndex, questions, isTTSActive, hasSpoken, selectedVoice]);

//   // Handle mic click for speech recognition
//   const handleMicClick = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition is not supported in this browser.");
//       return;
//     }

//     if (isListening) {
//       recognitionRef.current.stop();
//     } else {
//       recognitionRef.current.start();
//     }
//   };

//   // Handle answer submission
//   const handleAnswerSubmit = () => {
//     const currentQuestion = questions[currentQuestionIndex];

//     if (!navigator.onLine) {
//       alert("Internet not connected. Please re-submit your answers.");
//       return;
//     }

//     if (answer.trim() === "") {
//       alert("Please provide an answer before moving to the next question.");
//       return;
//     }

//     // Calculate time taken for the current question in minutes
//     const endTime = Date.now();
//     const timeTakenInSeconds = startTimeRef.current
//       ? Math.floor((endTime - startTimeRef.current) / 1000)
//       : 0;
//     const timeTakenInMinutes = (timeTakenInSeconds / 60).toFixed(2); // Convert to minutes and round to 2 decimal places

//     // Save the current answer and ensure it updates correctly
//     setAnswers((prev) => {
//       const updatedAnswers = [
//         ...prev,
//         {
//           id: currentQuestion.id,
//           answer,
//           time_taken: parseFloat(timeTakenInMinutes),
//         },
//       ];
//       if (updatedAnswers.length === questions.length) {
//         submitAnswersToBackend();
//       }

//       return updatedAnswers;
//     });

//     setAnswer(""); // Clear input for next question

//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1); // Move to the next question
//       setHasSpoken(false);
//       startTimeRef.current = Date.now(); // Reset the timer for the next question
//       setElapsedTime(0); // Reset the elapsed time for the next question
//     }
//   };

//   // Submit answers to the backend
//   const submitAnswersToBackend = async () => {
//     const rollno = localStorage.getItem("userEmail");
//     const test_id = localStorage.getItem("test_id");

//     // Log the payload being sent
//     console.log("Submitting answers:", { rollno, testid: test_id, answers });

//     try {
//       const response = await fetch("http://127.0.0.1:5001/submit_answers", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           rollno,
//           testid: test_id,
//           answers,
//         }),
//       });

//       if (response.ok) {
//         alert("Answers submitted successfully!");
//         setIsTestFinished(true);
//       } else {
//         console.error("Failed to submit answers");
//         alert("Failed to submit answers. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error submitting answers:", error);
//       alert("An error occurred while submitting answers.");
//     }
//   };
//   // Handle feedback submission
//   const handleFeedbackSubmit = () => {
//     if (feedback1.trim() === "" || feedback2.trim() === "") {
//       alert("Please provide the feedback.");
//       return;
//     }
//     submitFeedback();
//   };

//   // Submit feedback to the backend
//   const submitFeedback = async () => {
//     try {
//       const response = await fetch("http://127.0.0.1:5001/submit_feedback", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           feedback1: feedback1,
//           feedback2: feedback2,
//         }),
//       });

//       if (response.ok) {
//         alert("Thank you for the feedback!");
//         navigate("/dashborad");
//       } else {
//         console.error("Failed to submit Feedback");
//         alert("Failed to submit Feedback. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error submitting Feedback:", error);
//       alert("An error occurred while submitting Feedback.");
//     }
//   };

//   // Start the timer when the question changes
//   useEffect(() => {
//     startTimeRef.current = Date.now(); // Start the timer for the current question
//     setElapsedTime(0); // Reset the elapsed time for the current question

//     const timerInterval = setInterval(() => {
//       setElapsedTime((prev) => prev + 1); // Increment the elapsed time every second
//     }, 1000);

//     return () => clearInterval(timerInterval); // Cleanup the interval on component unmount or question change
//   }, [currentQuestionIndex]);

//   return (
//     <div className="home">
//       <Header />
//       <div className="home-content">
//         {isTestFinished ? (
//           <div className="feedback-form">
//             <h2>Feedback Form</h2>
//             <div>
//               <label>
//                 How helpful did you find the mock interview system in preparing
//                 for real interviews?
//                 <input
//                   type="text"
//                   value={feedback1}
//                   onChange={(e) => setFeedback1(e.target.value)}
//                   placeholder="Enter your feedback"
//                 />
//               </label>
//             </div>
//             <div>
//               <label>
//                 Do you have any suggestions or improvements for enhancing the
//                 mock interview system?
//                 <input
//                   type="text"
//                   value={feedback2}
//                   onChange={(e) => setFeedback2(e.target.value)}
//                   placeholder="Enter your feedback"
//                 />
//               </label>
//             </div>
//             <button onClick={handleFeedbackSubmit}>Submit Feedback</button>
//             <br />
//             <br />
//             <button onClick={() => navigate("/dashborad")}>Skip</button>
//           </div>
//         ) : (
//           <>
//             {questions.length > 0 ? (
//               <div className="question-container">
//                 <h2>Question {currentQuestionIndex + 1}</h2>
//                 <h2>{questions[currentQuestionIndex].question}</h2>
//                 <div className="input-speaker">
//                   <input
//                     type="text"
//                     value={answer}
//                     onChange={(e) => setAnswer(e.target.value)}
//                     className="answer-textbox"
//                     placeholder="Type your answer here..."
//                   />
//                   <button
//                     onClick={() => {
//                       speakText(questions[currentQuestionIndex].question);
//                     }}
//                     className="speaker-button"
//                   >
//                     <span role="img" aria-label="Speaker">
//                       🔊
//                     </span>
//                   </button>
//                   <button
//                     className={`mic-button ${isListening ? "active" : ""}`}
//                     title={
//                       isListening
//                         ? "Click to stop recording"
//                         : "Click to start recording"
//                     }
//                     onClick={handleMicClick}
//                   >
//                     <span role="img" aria-label="Microphone">
//                       🎤
//                     </span>
//                   </button>
//                 </div>

//                 <div className="controls">
//                   <button
//                     onClick={handleAnswerSubmit}
//                     className="submit-button"
//                   >
//                     {currentQuestionIndex === questions.length - 1
//                       ? "Finish Test"
//                       : "Next Question"}
//                   </button>
//                   <br />
//                   <button
//                     onClick={() => setIsTTSActive(!isTTSActive)}
//                     className="tts-toggle-button"
//                   >
//                     {isTTSActive
//                       ? "Disable Text-to-Speech"
//                       : "Enable Text-to-Speech"}
//                   </button>
//                 </div>
//                 <div className="voiceSelect">
//                   <select
//                     value={selectedVoice ? selectedVoice.name : ""}
//                     onChange={(e) => {
//                       const voice = voices.find(
//                         (v) => v.name === e.target.value
//                       );
//                       if (voice) setSelectedVoice(voice);
//                     }}
//                     className="voice-select"
//                   >
//                     {voices.map((voice) => (
//                       <option key={voice.name} value={voice.name}>
//                         {voice.name} ({voice.lang})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="timer">
//                   <p>Time Elapsed: {elapsedTime} seconds</p>
//                 </div>
//               </div>
//             ) : (
//               <p>Loading questions...</p>
//             )}
//           </>
//         )}
//         <img
//           src="/AIbot.jpg"
//           alt="Visual Representation"
//           className="question-image"
//         />
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default HomePage;


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
  const [answer, setAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<
    { id: number; answer: string; time_taken: number }[]
  >([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTTSActive, setIsTTSActive] = useState<boolean>(true);
  const [hasSpoken, setHasSpoken] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
  const [feedback1, setFeedback1] = useState<string>("");
  const [feedback2, setFeedback2] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // State to store elapsed time
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null); // To track start time for each question
  const navigate = useNavigate();

  // Fetch questions from the backend
  useEffect(() => {
    const fetchQuestions = async () => {
      const email = localStorage.getItem("userEmail");

      if (!email) {
        alert("User email is missing. Please log in again.");
        navigate("/login");
        return;
      }

      try {
        let response;

        // Check if there is resume_test_data in localStorage
        const resumeTestData = localStorage.getItem("resume_test_data");
        if (resumeTestData) {
          console.log("Resume Test Data Found:", resumeTestData);
          const data = JSON.parse(resumeTestData);
          setQuestions(data.questions || []);
          localStorage.removeItem("resume_test_data"); // Clear resume data
          return;
        } else {
          // If no resume data, start a new test
          const numQuestions = localStorage.getItem("numQuestions");
          const selectedTopics = JSON.parse(
            localStorage.getItem("selectedTopics") || "[]"
          );

          if (!numQuestions || selectedTopics.length === 0) {
            alert(
              "Required details are missing. Please go back to the details page."
            );
            navigate("/dashboard");
            return;
          }

          response = await fetch("http://127.0.0.1:5001/start_test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              numQuestions: parseInt(numQuestions),
              selectedTopics,
            }),
          });
        }

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Questions:", data.questions);
          setQuestions(data.questions || []);
          if (data.test_id) {
            localStorage.setItem("test_id", data.test_id);
          }
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
  }, [navigate]);

  // Fetch available voices and filter for English voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const englishVoices = availableVoices.filter((voice) =>
        voice.lang.startsWith("en")
      );
      setVoices(englishVoices);
      if (englishVoices.length > 0) {
        setSelectedVoice(englishVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
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
      setAnswer((prev) => prev + " " + transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }

  // Function to speak text using the selected voice
  const speakText = (text: string) => {
    if (!selectedVoice) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = selectedVoice;
    speech.lang = selectedVoice.lang;
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  // Speak the current question when it changes
  useEffect(() => {
    if (isTTSActive && questions.length > 0 && !hasSpoken) {
      speakText(questions[currentQuestionIndex].question);
      setHasSpoken(true);
    }
  }, [currentQuestionIndex, questions, isTTSActive, hasSpoken, selectedVoice]);

  // Handle mic click for speech recognition
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

  // -------------------------------
  // OLD CODE:
  // The original implementation updated the answers state and then attempted to submit answers.
  // However, the asynchronous nature of setState meant the last answer might not be included.
  //
  // const handleAnswerSubmit = () => {
  //   const currentQuestion = questions[currentQuestionIndex];
  //
  //   if (!navigator.onLine) {
  //     alert("Internet not connected. Please re-submit your answers.");
  //     return;
  //   }
  //
  //   if (answer.trim() === "") {
  //     alert("Please provide an answer before moving to the next question.");
  //     return;
  //   }
  //
  //   // Calculate time taken for the current question in minutes
  //   const endTime = Date.now();
  //   const timeTakenInSeconds = startTimeRef.current
  //     ? Math.floor((endTime - startTimeRef.current) / 1000)
  //     : 0;
  //   const timeTakenInMinutes = (timeTakenInSeconds / 60).toFixed(2);
  //
  //   setAnswers((prev) => [
  //     ...prev,
  //     {
  //       id: currentQuestion.id,
  //       answer,
  //       time_taken: parseFloat(timeTakenInMinutes),
  //     },
  //   ]);
  //
  //   setAnswer(""); // Clear input for next question
  //
  //   if (currentQuestionIndex < questions.length - 1) {
  //     setCurrentQuestionIndex((prev) => prev + 1);
  //     setHasSpoken(false);
  //     startTimeRef.current = Date.now();
  //     setElapsedTime(0);
  //   } else {
  //     // Last answer might not have been sent because state update is asynchronous.
  //     submitAnswersToBackend();
  //   }
  // };
  //
  // const submitAnswersToBackend = async () => {
  //   // This function relied on answers state which might be outdated.
  //   // ...
  // };
  // -------------------------------
  
  // NEW CODE:
  // Updated implementation to pass the updated answers array directly so the last answer is included.
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

    // Calculate time taken for the current question in minutes
    const endTime = Date.now();
    const timeTakenInSeconds = startTimeRef.current
      ? Math.floor((endTime - startTimeRef.current) / 1000)
      : 0;
    const timeTakenInMinutes = parseFloat((timeTakenInSeconds / 60).toFixed(2));

    // Update answers and pass the updated array to the backend if it's the last question.
    setAnswers((prev) => {
      const updatedAnswers = [
        ...prev,
        {
          id: currentQuestion.id,
          answer,
          time_taken: timeTakenInMinutes,
        },
      ];

      // Submit answers immediately if this was the last question.
      if (updatedAnswers.length === questions.length) {
        submitAnswersToBackend(updatedAnswers);
      }

      return updatedAnswers;
    });

    setAnswer(""); // Clear input for next question

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setHasSpoken(false);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
    }
  };

  // New submitAnswersToBackend accepting answers directly.
  const submitAnswersToBackend = async (answersToSubmit: any[]) => {
    const rollno = localStorage.getItem("userEmail");
    const test_id = localStorage.getItem("test_id");

    console.log("Submitting answers:", {
      rollno,
      testid: test_id,
      answers: answersToSubmit,
    });

    try {
      const response = await fetch("http://127.0.0.1:5001/submit_answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollno,
          testid: test_id,
          answers: answersToSubmit,
        }),
      });

      if (response.ok) {
        alert("Answers submitted successfully!");
        setIsTestFinished(true);
      } else {
        console.error("Failed to submit answers");
        alert("Failed to submit answers. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("An error occurred while submitting answers.");
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (feedback1.trim() === "" || feedback2.trim() === "") {
      alert("Please provide the feedback.");
      return;
    }
    submitFeedback();
  };

  // Submit feedback to the backend
  const submitFeedback = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5001/submit_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback1: feedback1,
          feedback2: feedback2,
        }),
      });

      if (response.ok) {
        alert("Thank you for the feedback!");
        navigate("/dashboard");
      } else {
        console.error("Failed to submit Feedback");
        alert("Failed to submit Feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting Feedback:", error);
      alert("An error occurred while submitting Feedback.");
    }
  };

  // Start the timer when the question changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [currentQuestionIndex]);

  return (
    <div className="home">
      <Header />
      <div className="home-content">
        {isTestFinished ? (
          <div className="feedback-form">
            <h2>Feedback Form</h2>
            <div>
              <label>
                How helpful did you find the mock interview system in preparing
                for real interviews?
                <input
                  type="text"
                  value={feedback1}
                  onChange={(e) => setFeedback1(e.target.value)}
                  placeholder="Enter your feedback"
                />
              </label>
            </div>
            <div>
              <label>
                Do you have any suggestions or improvements for enhancing the
                mock interview system?
                <input
                  type="text"
                  value={feedback2}
                  onChange={(e) => setFeedback2(e.target.value)}
                  placeholder="Enter your feedback"
                />
              </label>
            </div>
            <button onClick={handleFeedbackSubmit}>Submit Feedback</button>
            <br />
            <br />
            <button onClick={() => navigate("/dashboard")}>Skip</button>
          </div>
        ) : (
          <>
            {questions.length > 0 ? (
              <div className="question-container">
                <h2>Question {currentQuestionIndex + 1}</h2>
                <h2>{questions[currentQuestionIndex].question}</h2>
                <div className="input-speaker">
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
                    <span role="img" aria-label="Speaker">
                      🔊
                    </span>
                  </button>
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
                </div>
                <div className="controls">
                  <button
                    onClick={handleAnswerSubmit}
                    className="submit-button"
                  >
                    {currentQuestionIndex === questions.length - 1
                      ? "Finish Test"
                      : "Next Question"}
                  </button>
                  <br />
                  <button
                    onClick={() => setIsTTSActive(!isTTSActive)}
                    className="tts-toggle-button"
                  >
                    {isTTSActive
                      ? "Disable Text-to-Speech"
                      : "Enable Text-to-Speech"}
                  </button>
                </div>
                <div className="voiceSelect">
                  <select
                    value={selectedVoice ? selectedVoice.name : ""}
                    onChange={(e) => {
                      const voice = voices.find(
                        (v) => v.name === e.target.value
                      );
                      if (voice) setSelectedVoice(voice);
                    }}
                    className="voice-select"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="timer">
                  <p>Time Elapsed: {elapsedTime} seconds</p>
                </div>
              </div>
            ) : (
              <p>Loading questions...</p>
            )}
          </>
        )}
        <img
          src="/AIbot.jpg"
          alt="Visual Representation"
          className="question-image"
        />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
