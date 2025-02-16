import React, { useState, useEffect, ChangeEvent } from "react";
import "./details.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const DetailsPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]); // Topics fetched from the backend
  const [topicDifficulties, setTopicDifficulties] = useState<{
    [topic: string]: string;
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch topics from the backend
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

  // Handle number of questions change
  const handleNumQuestionsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
  };

  // Handle topic selection
  const handleTopicChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = event.target.value;
    setSelectedTopics((prevTopics) =>
      prevTopics.includes(selectedOption)
        ? prevTopics.filter((topic) => topic !== selectedOption)
        : [...prevTopics, selectedOption]
    );

    setTopicDifficulties((prev) => ({
      ...prev,
      [selectedOption]: prev[selectedOption] || "", // Initialize if not already set
    }));
  };

  // Handle difficulty selection for each topic
  const handleTopicDifficultyChange = (topic: string, difficulty: string) => {
    setTopicDifficulties((prev) => ({
      ...prev,
      [topic]: difficulty,
    }));
  };

  // Remove topic from selection
  const removeTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.filter((t) => t !== topic));
    setTopicDifficulties((prev) => {
      const newDifficulties = { ...prev };
      delete newDifficulties[topic];
      return newDifficulties;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    const email = localStorage.getItem("userEmail"); // Get email from local storage
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
    localStorage.setItem(
      "selectedTopics",
      JSON.stringify(topicsWithDifficulty)
    );

    const formData = {
      email,
      apiUrl,
      topics: topicsWithDifficulty,
    };

    navigate("/home");

    // try {
    //   const response = await fetch("http://127.0.0.1:5000/start_test", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(formData),
    //   });

    //   if (!response.ok) {
    //     throw new Error("Failed to submit data");
    //   }

    //   const result = await response.json();
    //   console.log("Form submitted successfully:", result);
    //   alert("Form submitted successfully!");

    //   if (result.test_id) {
    //     localStorage.setItem("test_id", result.test_id);
    //   }

    //   alert("Form submitted successfully!");
    // } catch (error) {
    //   console.error("Error submitting form:", error);
    //   alert("Failed to submit form");
    // }
  };

  return (
    <div className="App">
      <Header />

      <div className="input-container">
        <label htmlFor="multi-select">Select Topics:</label>
        {loading ? (
          <p>Loading topics...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <select
            id="multi-select"
            className="multi-select"
            onChange={handleTopicChange}
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        )}

        {/* Display selected topics and difficulty selection */}
        {selectedTopics.length > 0 && (
          <div className="selected-topics">
            {selectedTopics.map((topic) => (
              <div key={topic} className="topic-difficulty-container">
                <span className="topic-pill" onClick={() => removeTopic(topic)}>
                  {topic} &times;
                </span>
                <label htmlFor={`difficulty-${topic}`}>
                  Difficulty for {topic}:
                </label>
                <select
                  id={`difficulty-${topic}`}
                  className="difficulty-select"
                  value={topicDifficulties[topic] || ""}
                  onChange={(e) =>
                    handleTopicDifficultyChange(topic, e.target.value)
                  }
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

      <Footer />
    </div>
  );
};

export default DetailsPage;
