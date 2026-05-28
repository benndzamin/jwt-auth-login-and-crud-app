import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCurrentUser } from '../utils/Auth';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // 1. Stanje za loader
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        // Check if user is already logged in by fetching token from sessionStorage
        const token = sessionStorage.getItem("token");
        if (token) {
            const user = getCurrentUser();
            if (user && user.role) {
                if (user.role === "Admin") {
                    navigate("/admin-dashboard");
                } else if (user.role === "User") {
                    navigate("/user-dashboard");
                }
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true); // 2. Čim klikneš na dugme, pali se loader

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
                username,
                password,
            });

            sessionStorage.setItem("token", response.data.token);
            const user = getCurrentUser();
            setUser(user);
            toast.success("Login successful! Redirecting...");

            // After a short delay, we read the role and redirect the user
            setTimeout(() => {
                if (user.role === "Admin") {
                    navigate("/admin-dashboard");
                } else if (user.role === "User") {
                    navigate("/user-dashboard");
                } else {
                    toast.error("Unknown role!");
                    setIsLoading(false); // Gasi loader ako je uloga nepoznata
                }
                window.location.reload();
            }, 1500);
        } catch (err) {
            // Ako api baci grešku, ispiši je i obavezno ugasi loader da se dugme odmrzne
            toast.error(err.response?.data?.message || "Error during login.");
            setIsLoading(false);
        }
    };

    return (
        <div className="container text-end" style={{ width: "500px", margin: "auto" }}>
            <div className="card shadow p-4 bg-light">
                <h2 className="text-center mb-4">Login</h2>

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label htmlFor="username" className="form-label mb-0">
                                Username
                            </label>
                        </div>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <label htmlFor="password" className="form-label mb-0">
                                Password
                            </label>
                        </div>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                id="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span
                                className="input-group-text"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ cursor: "pointer" }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                        </div>
                    </div>

                    {/* 3. Dinamičko dugme sa loaderom i disabled stanjem */}
                    <button
                        type="submit"
                        className="btn btn-primary d-inline-flex align-items-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Logging in...
                            </>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>

                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar
                    closeOnClick
                    pauseOnHover
                    draggable
                    theme="colored"
                />
            </div>
        </div>
    );
}

export default Login;