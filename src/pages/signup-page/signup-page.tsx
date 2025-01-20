import React, { useState } from "react";
import Header from "../../components/Header/Header.tsx";
import Footer from "../../components/Footer/Footer.tsx";
import "./../signup-page/signup-page.css"; // Custom CSS for the signup page

const SignUpPage: React.FC = () => {
  const [name, setName] = useState<string>(""); // State for name
  const [rollNumber, setRollNumber] = useState<string>(""); // State for roll number
  const [department, setDepartment] = useState<string>(""); // State for department
  const [year, setYear] = useState<string>(""); // State for year
  const [cgpa, setCgpa] = useState<string>(""); // State for CGPA
  const [email, setEmail] = useState<string>(""); // State for email
  const [password, setPassword] = useState<string>(""); // State for password

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      name,
      rollNumber,
      department,
      year,
      cgpa,
      email,
      password,
    });
  };

  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="login-form-container">
          <h2>Sign Up</h2>
          <form onSubmit={handleSignUp}>
            <div className="form-flex-container">
              {/* Left Section */}
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
              </div>

              {/* Right Section */}
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
            </div>
            <button type="submit" className="login-button">
              Sign Up
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUpPage;
