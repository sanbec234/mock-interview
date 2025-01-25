import React, { useState, useEffect, ChangeEvent } from 'react';
import './details.css';
import Header from './../../components/Header/Header';
import Footer from './../../components/Footer/Footer';
import { useNavigate } from 'react-router-dom'; // Use the navigate function

const DetailsPage: React.FC = () => {
  const [numQuestions, setNumQuestions] = useState<number | string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/topics');
        if (!response.ok) {
          throw new Error(`Failed to fetch topics. Status: ${response.status}`);
        }
        const data = await response.json();
        setTopics(data.topics || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch topics.');
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const handleNumQuestionsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNumQuestions(value === '' ? '' : parseInt(value));
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedTopics((prevTopics) =>
      checked
        ? [...prevTopics, value]
        : prevTopics.filter((topic) => topic !== value)
    );
  };

  const removeTopic = (topic: string) => {
    setSelectedTopics(selectedTopics.filter((t) => t !== topic));
  };

  const handleSubmit = async () => {
    const email = localStorage.getItem('userEmail'); // Get email from local storage
    if (!email) {
      alert('User email not found. Please log in again.');
      return;
    }

    if (!numQuestions || selectedTopics.length === 0) {
      alert('Please specify the number of questions and select at least one topic.');
      return;
    }

    // Save data to localStorage
    localStorage.setItem('numQuestions', numQuestions.toString());
    localStorage.setItem('selectedTopics', JSON.stringify(selectedTopics));

    const formData = {
      email, // Include email in the payload
      numQuestions,
      selectedTopics,
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/start_test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit data');
      }

      const result = await response.json();
      console.log('Form submitted successfully:', result);

      // Store test_id in localStorage (optional, if backend sends it)
      if (result.test_id) {
        localStorage.setItem('test_id', result.test_id);
      }

      alert('Form submitted successfully!');
      navigate('/home');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.message || 'Failed to submit form');
    }
  };

  return (
    <div className="App">
      <Header />

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

        <label htmlFor="checkbox-topics">Select Topics:</label>
        {loading ? (
          <p>Loading topics...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="checkbox-group">
            {topics.map((topic) => (
              <div key={topic} className="checkbox-item">
                <label>
                  <input
                    type="checkbox"
                    value={topic}
                    checked={selectedTopics.includes(topic)}
                    onChange={handleCheckboxChange}
                  />
                  {topic}
                </label>
              </div>
            ))}
          </div>
        )}

        {selectedTopics.length > 0 && (
          <div className="selected-topics">
            {selectedTopics.map((topic) => (
              <span key={topic} className="topic-pill" onClick={() => removeTopic(topic)}>
                {topic} &times;
              </span>
            ))}
          </div>
        )}

        <button className="submit-form-button" onClick={handleSubmit}>
          Submit
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default DetailsPage;
