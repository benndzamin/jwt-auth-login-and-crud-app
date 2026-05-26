import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UserDashboard() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchUserData(token);
        }
    }, [navigate]);

    const fetchUserData = async (token) => {
        if (!token) {
            setError('Token not found.');
            return;
        }
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setUserData(response.data);
        } catch (err) {
            if (err.response) {
                setError(`Error: ${err.response.status} - ${err.response.data.message || 'Error loading user data.'}`);
            } else {
                setError('Error connecting to server.');
            }
        }
    };

    return (
        <div className="container">
            <div className="card shadow p-4 bg-light">
                <h2 className="mb-4">User Dashboard</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {userData ? (
                    <div>
                        <p><strong>User:</strong> {userData.username}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Role:</strong> {userData.role}</p>
                        <p><strong>Created Date:</strong> {userData.created}</p>
                        <p><strong>Status:</strong> {userData.active ? 'ACTIVE' : 'INACTIVE'}</p>

                    </div>
                ) : (
                    <p>Loading user data...</p>
                )}
            </div>
        </div>
    );
}

export default UserDashboard;
