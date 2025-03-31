import React, { useState, useEffect, ChangeEvent } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import "./view-students.css";

// Updated Student interface to include test details from API
interface Student {
  id: number;
  name: string;
  yearuser: string;
  email: string;
  department: string;
  coverPhoto?: string;
  profilePic?: string;
  tests?: { created_at: string; mark: number; test_id: number }[];
}

// Define type for backend response
interface Data {
  [key: string]: Student[];
}

export const ViewStudents: React.FC = () => {
  const navigate = useNavigate();
  const [openClasses, setOpenClasses] = useState<string[]>([]);
  const [classData, setClassData] = useState<Data>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<"student" | "class">("student");

  // Fetch data from backend and process test data
  useEffect(() => {
    fetch("http://localhost:5000/students")
      .then((response) => response.json())
      .then((jsonData: Data) => {
        // Ensure that each student has tests in the proper format
        Object.keys(jsonData).forEach((cls) => {
          jsonData[cls] = jsonData[cls].map((student) => ({
            ...student,
            // If tests exist, leave them as is since keys match the JSON structure
            tests: student.tests ? student.tests : [],
          }));
        });
        setClassData(jsonData);
        console.log("Fetched Class Data:", jsonData);
      })
      .catch((error) => console.error("Error fetching class data:", error));
  }, []);

  // Toggle class expansion
  const toggleClass = (cls: string): void => {
    setOpenClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  // Navigate to student details
  const handleStudentClick = (student: Student | undefined): void => {
    if (!student) return;
    console.log("Navigating to Student Profile:", student);
    navigate(`/student/${student.id}`, { state: { student } });
    setSearchTerm(""); // Clear search input
    setSuggestions([]); // Hide dropdown
  };

  // Scroll to class section
  const handleClassClick = (cls: string): void => {
    const classElement = document.getElementById(cls);
    if (classElement) {
      classElement.scrollIntoView({ behavior: "smooth" });
    }
    setSearchTerm(""); // Clear search input
    setSuggestions([]); // Hide dropdown
  };

  // Handle search input
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value;
    setSearchTerm(query);

    if (query.length === 0) {
      setSuggestions([]);
      return;
    }

    if (searchType === "student") {
      // Search students
      const studentSuggestions = Object.values(classData)
        .flat()
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .map((s) => s.name);
      setSuggestions(studentSuggestions);
    } else {
      // Search classes
      const classSuggestions = Object.keys(classData).filter((cls) =>
        cls.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(classSuggestions);
    }
  };

  return (
    <div className="container-2">
      <h1>Student Details</h1>

      {/* Search Bar */}
      <div className="search-container-2">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={`Search for a ${searchType}...`}
        />
        <button
          onClick={() =>
            setSearchType(searchType === "student" ? "class" : "student")
          }
        >
          Search: {searchType}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <ul className="suggestions-list-2">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                if (searchType === "student") {
                  const student: Student | undefined = Object.values(classData)
                    .flat()
                    .find((s) => s.name === item);
                  handleStudentClick(student);
                } else {
                  handleClassClick(item);
                }
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Class List */}
      <div className="scroll-container-2">
        {Object.keys(classData).map((cls) => (
          <div key={cls} id={cls} className="class-container-2">
            <div className="class-header-2" onClick={() => toggleClass(cls)}>
              {cls}
              <span className="arrow">
                {openClasses.includes(cls) ? "▲" : "▼"}
              </span>
            </div>
            {openClasses.includes(cls) && (
              <ul className="student-list-2">
                {classData[cls].map((student) => (
                  <li
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className="student-item-2"
                  >
                    {student.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Define type for location state used for passing student data.
interface LocationState {
  student: Student;
}

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigator = useNavigate();
  const state = location.state as LocationState | undefined;
  const student = state?.student;

  if (!student) {
    return (
      <div className="dashboard-container-2-2">
        <h2>Student not found</h2>
        <Link to="/" className="back-btn-2">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container-2-2">
      {/* Top Section: Profile and Cover Photo */}
      <div className="profile-layout">
        <div className="profile-left">
          <div className="cover-photo">
            <img
              src={
                student.coverPhoto ||
                "https://source.unsplash.com/900x150/?landscape"
              }
              alt="Cover"
            />
          </div>
          <div className="profile-info">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
              alt="Profile"
              className="profile-pic"
            />
            <h1>{student.name}</h1>
            <p>Year: {student.yearuser}</p>
          </div>
        </div>

        <div className="profile-right">
          <div className="profile-details">
            <p>
              <strong>ID:</strong> {student.id}
            </p>
            <p>
              <strong>Email:</strong> {student.email}
            </p>
            <p>
              <strong>Department:</strong> {student.department}
            </p>
          </div>
        </div>
      </div>

      {/* Tests Taken Section */}
      {/* Tests Taken Section */}
      <div className="tests-container-2">
        <h2>Tests Taken</h2>
        <div className="tests-scroll">
          {student.tests && student.tests.length > 0 ? (
            <ul>
              {student.tests.map((test, index) => (
                <li
                  key={index}
                  className="test-item"
                  onClick={() => {
                    navigator("/completion-page", {
                      state: { test: test.test_id },
                    });
                  }}
                >
                  <p>
                    <strong>Test ID:</strong> {test.test_id}
                  </p>
                  <p>
                    <strong>Mark:</strong> {test.mark}
                  </p>
                  <p>
                    <strong>Date:</strong> {test.created_at}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tests available yet.</p>
          )}
        </div>
      </div>

      <Link to="/" className="back-btn-2">
        Back to Home
      </Link>
    </div>
  );
};
