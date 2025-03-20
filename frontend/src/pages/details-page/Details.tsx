import React, { useState, useEffect, ChangeEvent } from "react";
import "./details.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const DetailsPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]); // Topics fetched from the backend
  const [topicDifficulties, setTopicDifficulties] = useState<{ [topic: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/topics");
        if (!response.ok) {
          throw new Error(`Failed to fetch topics. Status: ${response.status}`);
        }
        const data = await response.json();
        setTopics(data.topics || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch topics.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const handleTopicChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = event.target.value;
  
    if (!selectedOption) {
      return; // Prevents updating if no valid selection is made
    }
  
    setSelectedTopics((prevTopics) => {
      const updatedTopics = prevTopics.includes(selectedOption)
        ? prevTopics.filter((topic) => topic !== selectedOption)
        : [...prevTopics, selectedOption];
  
      setTopicDifficulties((prev) => ({
        ...prev,
        [selectedOption]: prev[selectedOption] || "Medium", // Default to Medium
      }));
  
      return updatedTopics;
    });
  
    // Reset dropdown selection to "Choose a topic" after selection
    event.target.value = "";
  };
  

  const handleTopicDifficultyChange = (topic: string, difficulty: string) => {
    setTopicDifficulties((prev) => ({
      ...prev,
      [topic]: difficulty,
    }));
  };

  const removeTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.filter((t) => t !== topic));
    setTopicDifficulties((prev) => {
      const newDifficulties = { ...prev };
      delete newDifficulties[topic];
      return newDifficulties;
    });
  };

  const handleSubmit = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("User email not found. Please log in again.");
      return;
    }

    const topicsWithDifficulty = selectedTopics.map((topic) => ({
      topic,
      difficulty: topicDifficulties[topic] || "",
    }));

    const numQuestionLen = selectedTopics.length * 3;
    localStorage.setItem("numQuestions", numQuestionLen.toString());
    localStorage.setItem("selectedTopics", JSON.stringify(topicsWithDifficulty));

    const formData = {
      email,
      apiUrl,
      topics: topicsWithDifficulty,
    };

    navigate("/home");
  };

  return (
    <div className="App">
      <Header />
      <div className="details-container">
        <div className="image-container">
          <img src="/choose.jpg" alt="Choose Topics" />
        </div>
        <div className="input-container">
          <h2>Choose Your Topics</h2>

          <label htmlFor="multi-select">Select Topics:</label>
          {loading ? (
            <p>Loading topics...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <select id="multi-select" className="multi-select" onChange={handleTopicChange}>
  <option value="" disabled selected  >
    Choose one or more topic
  </option>
  {topics.map((topic) => (
    <option key={topic} value={topic}>
      {topic}
    </option>
  ))}
</select>

          )}

          {selectedTopics.length > 0 && (
            <div className="selected-topics">
              {selectedTopics.map((topic) => (
                <div key={topic} className="topic-difficulty-container">
                  <span className="topic-pill" onClick={() => removeTopic(topic)}>
                    {topic} &times;
                  </span>
                  <label htmlFor={`difficulty-${topic}`}>Difficulty for {topic}:</label>
                  <select
                    id={`difficulty-${topic}`}
                    className="difficulty-select"
                    value={topicDifficulties[topic] || ""}
                    onChange={(e) => handleTopicDifficultyChange(topic, e.target.value)}
                  >
                    <option value="" disabled>
                      Select difficulty
                    </option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          <label htmlFor="api-url">API URL:</label>
          <input
            id="api-url"
            type="text"
            className="api-input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="Enter API URL"
          />

          <button className="submit-form-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DetailsPage;