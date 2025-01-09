import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import './login-page.css'; // Custom CSS for styling
import Header from '../../components/Header/Header.tsx'; // Header component
import Footer from '../../components/Footer/Footer.tsx'; // Footer component
import axios from 'axios'; // For API requests

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>(''); // State for email input
  const [password, setPassword] = useState<string>(''); // State for password input
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // State to manage form submission
  const navigate = useNavigate(); // Initialize the useNavigate hook

  // Handle the form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (isSubmitting) return; // Prevent multiple submissions

    // Basic validation for the email and password fields
    if (!email.trim() || !password.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true); // Set the form submission state to true (loading)
    try {
      // Send login credentials to the Flask API
      const response = await axios.post(
        'http://localhost:5000/login',
        { email, password },
        { withCredentials: true } // Ensures cookies are included
      );

      if (response.status === 200) {
        alert('Login successful!'); // Show success message
        navigate('/home'); // Redirect to the home page
      }
    } catch (error: any) {
      console.error('Login failed:', error);

      // Display meaningful error messages
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message); // Show the error message from the server
      } else {
        alert('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false); // Reset the form submission state
    }
  };

  return (
    <div className="login-page">
      <Header /> {/* Custom Header component */}
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="login-button">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
      <Footer /> {/* Custom Footer component */}
    </div>
  );
};

export default LoginPage;
