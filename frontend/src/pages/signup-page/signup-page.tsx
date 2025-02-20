import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Header from './../../components/Header/Header';
import Footer from './../../components/Footer/Footer';
import "./signup-page.css"; // Custom CSS for the signup page

const SignUpPage: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [rollNumber, setRollNumber] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [cgpa, setCgpa] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [college,setCollege]=useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null); // State for feedback messages
  const navigate = useNavigate(); // Hook for navigation

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const payload = {
      name,
      rollno: rollNumber,
      department,
      year,
      cgpa,
      email,
      college,
      password,
    };

    try {
      const response = await fetch("http://localhost:5000/create_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        setName("");
        setRollNumber("");
        setDepartment("");
        setYear("");
        setCgpa("");
        setEmail("");
        setPassword("");
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error || "An error occurred"}`);
      }
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const goToLoginPage = () => {
    navigate("/login"); // Navigate to the login page
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="login-form-container">
          <h2>Sign Up</h2>
          <form onSubmit={handleSignUp}>
            <div className="form-flex-container">
              <div className="form-group-column">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rollNumber">Roll Number</label>
                  <input
                    type="text"
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter your roll number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter your department"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="college">College</label>
                  <input
                    type="text"
                    id="college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter your College Name"
                    required
                  />
                </div>
              </div>

              <div className="form-group-column">
                <div className="form-group">
                  <label htmlFor="year">Year</label>
                  <input
                    type="text"
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Enter your year"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cgpa">CGPA</label>
                  <input
                    type="text"
                    id="cgpa"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="Enter your CGPA"
                    required
                  />
                </div>
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
                
              </div>
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
            </div >
            <button type="submit" className="login-button">
              Sign Up
            </button>
          </form>
          {message && <p className="feedback-message">{message}</p>}
          <br></br>
          <button 
            className="login-button"
            onClick={goToLoginPage}
          >
            Go to Login Page
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUpPage;
