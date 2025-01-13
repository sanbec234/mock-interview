import React, { useState, useEffect, ChangeEvent } from 'react';
import './details.css';
import Header from './../../components/Header/Header.tsx';
import Footer from './../../components/Footer/Footer.tsx';

const DetailsPage: React.FC = () => {
  const [numQuestions, setNumQuestions] = useState<number | string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]); // Topics fetched from the backend
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch topics from the backend
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/topics');
        if (!response.ok) {
          throw new Error(`Failed to fetch topics. Status: ${response.status}`);
        }
        const data = await response.json();
        setTopics(data.topics || []); // Assuming the backend returns { topics: [...] }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch topics.');
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Handle changes in the number of questions field
  const handleNumQuestionsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNumQuestions(value === '' ? '' : parseInt(value));
  };

  // Handle changes in the multi-select dropdown
  const handleTopicChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = event.target.value;
    setSelectedTopics((prevTopics) =>
      prevTopics.includes(selectedOption)
        ? prevTopics.filter((topic) => topic !== selectedOption) // Remove if already selected
        : [...prevTopics, selectedOption] // Add if not already selected
    );
  };

  // Remove a selected topic when clicked
  const removeTopic = (topic: string) => {
    setSelectedTopics(selectedTopics.filter((t) => t !== topic));
  };

  // Handle form submission
  const handleSubmit = async () => {
    const formData = {
      numQuestions,
      apiUrl,
      selectedTopics,
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send form data as JSON
      });

      if (!response.ok) {
        throw new Error('Failed to submit data');
      }

      const result = await response.json();
      console.log('Form submitted successfully:', result);
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    }
  };

  return (
    <div className="App">
      <Header />

      {/* Main Content Starts Here */}
      <div className="input-container">
        <label htmlFor="num-questions">Number of Questions:</label>
        <input
          id="num-questions"
          type="number"
          className="number-input"
          value={numQuestions}
          onChange={handleNumQuestionsChange}
          placeholder="Enter a number"
        />

        <label htmlFor="multi-select">Select Topics:</label>
        {loading ? (
          <p>Loading topics...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <select
            id="multi-select"
            className="multi-select"
            multiple
            onChange={handleTopicChange}
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        )}

        {/* Display Selected Topics */}
        {selectedTopics.length > 0 && (
          <div className="selected-topics">
            {selectedTopics.map((topic) => (
              <span key={topic} className="topic-pill" onClick={() => removeTopic(topic)}>
                {topic} &times;
              </span>
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
      {/* Main Content Ends Here */}

      <Footer />
    </div>
  );
};

export default DetailsPage;