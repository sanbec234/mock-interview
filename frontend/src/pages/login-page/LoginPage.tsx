import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import './login-page.css'; // Custom CSS for styling
import Header from '../../components/Header/Header'; // Header component
import Footer from '../../components/Footer/Footer'; // Footer component

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>(''); // State for email input
  const [password, setPassword] = useState<string>(''); // State for password input
  const [userType, setUserType] = useState<string>(''); // State for user type selection
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // State to manage form submission
  const navigate = useNavigate(); // Initialize the useNavigate hook

  // Handle the form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (isSubmitting) return; // Prevent multiple submissions

    // Basic validation for the email, password, and user type fields
    if (!email.trim() || !password.trim() || !userType.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      email,
      password,
      userType
    }; // Set the form submission state to true (loading)
    try {
      // Send login credentials to the Flask API
      const response = await fetch(
        'http://localhost:5000/login_user', // Corrected endpoint
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), // Ensures cookies are included
        }
      );

      if (response.status === 200) {
        alert('Login successful!'); // Show success message

        // Store the email in local storage
        localStorage.setItem('userEmail', email);

        // Check user type and navigate accordingly
        if (userType === 'admin') {
          navigate('/admin'); // Redirect to admin dashboard
        } else {
          navigate('/dashborad'); // Redirect to student dashboard
        }
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
          <div className="form-group radio-buttons">
            <label>User Type</label>
            <div className="radio-options">
              <label>
                <input
                  type="radio"
                  value="admin"
                  checked={userType === 'admin'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                Admin
              </label>
              <label>
                <input
                  type="radio"
                  value="student"
                  checked={userType === 'student'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                Student
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="login-button"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          <br />
          <br />
          <button
            type="button"
            onClick={() => navigate('/sign-up')} // Redirect to signup page
            className="login-button"
          >
            Sign Up
          </button>
        </form>
      </div>
      <Footer /> {/* Custom Footer component */}
    </div>
  );
};

export default LoginPage;
