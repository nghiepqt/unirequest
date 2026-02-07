import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/auth';

    console.log("AuthContext: Initializing, loading:", loading);

    const fetchUser = async (token) => {
        console.log("AuthContext: Fetching user with token...");
        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error("AuthContext: Failed to fetch user:", error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            console.log("AuthContext: Finished fetching user, setting loading to false");
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log("AuthContext: Effect running, token found:", !!token);
        if (token) {
            fetchUser(token);
        } else {
            console.log("AuthContext: No token, setting loading to false");
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            await fetchUser(data.access_token);
            return true;
        }
        return false;
    };

    const register = async (data) => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.ok;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
