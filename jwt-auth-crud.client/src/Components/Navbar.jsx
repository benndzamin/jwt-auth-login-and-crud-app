import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { getCurrentUser } from '../utils/Auth';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user: authUser, logout } = useAuth();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [role, setRole] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');

        if (token) {
            const user = getCurrentUser();
            setRole(user?.role);
            setIsLoggedIn(true);
            fetchUserData(token);
        } else {
            setIsLoggedIn(false);
            setUsername('');
            setRole(null);
        }
    }, [authUser]); // Sluša promjene iz globalnog konteksta

    const fetchUserData = async (token) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/username`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setUsername(response.data.username);
        } catch (err) {
            setIsLoggedIn(false);
            if (err.response) {
                setError(`Error: ${err.response.status} - ${err.response.data.message || 'Error loading user data.'}`);
            } else {
                setError('Error connecting to server.');
            }
        }
    };

    // Pouzdana logout funkcija koja vraća direktno na landing stranu (/)
    const handleLogout = () => {
        // 1. Čistimo apsolutno sve podatke iz sesije
        sessionStorage.removeItem('token');
        sessionStorage.clear();

        // 2. Javimo Context-u da postavi korisnika na null
        if (logout) {
            logout();
        }

        // 3. Resetujemo lokalna stanja u navbaru
        setIsLoggedIn(false);
        setUsername('');
        setRole(null);

        // 4. Umjesto običnog navigate-a koji se bije sa dashboard useEffect-om, 
        // radimo čisti reload na korijen aplikacije. Ovo garantuje povratak na landing stranu!
        window.location.href = '/';
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary bg-gradient fixed-top">
            <div className="container">
                <a className="navbar-brand" href="/">JWT auth, login & CRUD app</a>
                <div className="ms-auto">
                    {isLoggedIn || authUser ? (
                        <>
                            <span className="mx-5 text-light fw-bold">
                                {role && <span className="badge bg-secondary me-2">{role}</span>}
                                <User size={30} className="me-1" /> {username || 'Korisnik'}
                            </span>
                            <button
                                className="btn btn-light px-4 py-2 mx-2"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-outline-light me-2" onClick={() => navigate('/login')}>
                                Login
                            </button>
                            <button className="btn btn-light" onClick={() => navigate('/register')}>
                                Register
                            </button>
                        </>
                    )}
                </div>
            </div>
            {error && (
                <div className="alert alert-danger position-absolute end-0 mt-5 me-3">
                    {error}
                </div>
            )}
        </nav>
    );
}

export default Navbar;