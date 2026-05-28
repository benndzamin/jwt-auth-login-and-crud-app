import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            if (user.role === "Admin") navigate("/admin-dashboard");
            else if (user.role === "User") navigate("/user-dashboard");
        }
    }, [user, navigate]);

  return (
    <div className="container text-center">
      <div className="card shadow-lg p-5 rounded bg-light">
        <h1 className="display-4 fw-bold mb-4 text-primary">
          Welcome to <span className="text-dark"> JWT auth, Login & CRUD App</span>
        </h1>
        <p className="lead mb-3">Candidate Intake Tasks</p>
        <p className="text-muted mb-4">
          <strong className="text-secondary">Fullstack Developer</strong> <br />
          <small>(ASP.NET Core & React.js & DevExpress)</small>
        </p>
        <button
          className="btn btn-outline-primary btn-lg px-5 mx-auto"
          onClick={() => navigate("/login")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default Home;
