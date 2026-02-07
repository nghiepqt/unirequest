import { createContext, useState, useContext, useEffect } from 'react';

const RequestContext = createContext();

export const useRequests = () => useContext(RequestContext);

export const RequestProvider = ({ children }) => {
    const [requests, setRequests] = useState([]);
    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/requests/';

    const fetchRequests = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        }
    };

    useEffect(() => {
        fetchRequests();
        // Poll every 5 seconds to simulate real-time updates
        const interval = setInterval(fetchRequests, 5000);
        return () => clearInterval(interval);
    }, []);

    const addRequest = async (data, parentId = null) => {
        try {
            const token = localStorage.getItem('token');
            const url = parentId ? `${API_URL}${parentId}/sub` : API_URL;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newRequest = await response.json();
                setRequests(prev => [newRequest, ...prev]);
                return newRequest;
            }
        } catch (error) {
            console.error("Failed to create request:", error);
        }
    };

    const updateRequestStatus = async (id, newStatus, note = "") => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, note }),
            });

            if (response.ok) {
                const updatedRequest = await response.json();
                setRequests(prev => prev.map(req =>
                    req.id === id ? updatedRequest : req
                ));
            }
        } catch (error) {
            console.error("Failed to update request:", error);
        }
    };

    const cancelRequest = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const updatedRequest = await response.json();
                // Refresh all to handle cascade updates
                await fetchRequests();
                return updatedRequest;
            }
        } catch (error) {
            console.error("Failed to cancel request:", error);
        }
    };

    const deleteRequest = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Refresh to update the list
                await fetchRequests();
                return true;
            }
        } catch (error) {
            console.error("Failed to delete request:", error);
        }
        return false;
    };

    return (
        <RequestContext.Provider value={{ requests, addRequest, updateRequestStatus, cancelRequest, deleteRequest }}>
            {children}
        </RequestContext.Provider>
    );
};
