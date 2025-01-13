import React, { useState } from 'react';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import './../login/loginpage.css'; // Custom CSS for the login page

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>(''); // State for username
  const [password, setPassword] = useState<string>(''); // State for password

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here (e.g., send a request to the backend)
    console.log('Username:', username, 'Password:', password);
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="login-form-container">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;