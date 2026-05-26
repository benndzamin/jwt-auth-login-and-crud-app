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

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
                username,
                password,
            });

            sessionStorage.setItem("token", response.data.token);
            const user = getCurrentUser();
            setUser(user);
            toast.success("Login  successfull! Redirecting...");
            // After a short delay, we read the role and redirect the user
            setTimeout(() => {
                if (user.role === "Admin") {
                    navigate("/admin-dashboard");
                } else if (user.role === "User") {
                    navigate("/user-dashboard");
                } else {
                    toast.error("Unknown role!");
                }
                window.location.reload();
            }, 1500);
        } catch (err) {
            toast.error(err.response.data.message || "Error during login.");
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

                    <button type="submit" className="btn btn-primary">
                        Login
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
