import { createContext, useContext, useState, useCallback } from 'react';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext();

/** Build a user object from localStorage if a token exists */
function loadUserFromStorage() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        name: localStorage.getItem('name') || '',
        role: (localStorage.getItem('role') || '').toLowerCase(),
        mobileNumber: localStorage.getItem('mobileNumber') || '',
        ward: localStorage.getItem('ward') || '',
        userId: localStorage.getItem('userId') || '',
    };
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadUserFromStorage);

    /** Called after successful backend login — accepts a user object { name, role, mobileNumber } */
    const loginUser = useCallback((userData) => {
        setUser(userData);
    }, []);

    const logoutUser = useCallback(() => {
        // Force-disconnect the shared socket on logout
        disconnectSocket();
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('mobileNumber');
        localStorage.removeItem('ward');
        localStorage.removeItem('userId');
        setUser(null);
        // Notify all listeners (NotificationContext, etc.) to clear state
        window.dispatchEvent(new Event('userLoggedOut'));
    }, []);

    /** Allow profile-style updates (UI only) */
    const updateUser = useCallback((fields) => {
        setUser(prev => prev ? { ...prev, ...fields } : prev);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading: false, loginUser, logoutUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
