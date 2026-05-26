import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Kreiramo Context za autentifikaciju
const AuthContext = createContext();

// AuthProvider će obezbijediti stanje korisnika kroz aplikaciju
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Držimo podatke o korisniku
    const [loading, setLoading] = useState(true); // Da znamo kada se podaci učitavaju

    // Funkcija koja dohvata korisnika sa servera
    const fetchUser = async () => {
        const token = sessionStorage.getItem('token'); // Uzimamo token sa sessionStorage
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data); // Postavljamo podatke o korisniku
        } catch (error) {
            console.error('Greška prilikom dohvata korisnika', error);
            setUser(null); // Ako dođe do greške, postavljamo korisnika na null
        } finally {
            setLoading(false); // Na kraju prestajemo sa učitavanjem
        }
    };

    useEffect(() => {
        fetchUser(); // Pozivamo funkciju da učitamo korisnika čim se komponenta mount-uje
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook za korišćenje AuthContext-a
export const useAuth = () => useContext(AuthContext);
