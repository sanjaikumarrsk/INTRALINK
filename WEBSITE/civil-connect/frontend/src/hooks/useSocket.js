import { useEffect, useState, useRef } from 'react';
import { connectSocket, releaseSocket, getSocket } from '../services/socket';

/**
 * Join the correct Socket.IO rooms based on the user's localStorage data.
 */
function joinRooms(sock) {
    const ward = localStorage.getItem('ward');
    const role = (localStorage.getItem('role') || '').toUpperCase();
    const userId = localStorage.getItem('userId') || '';
    if (ward) sock.emit('joinWard', ward);
    sock.emit('joinRoom', { userId, role, ward });
    console.log('[Socket] joinRoom sent:', { userId, role, ward });
}

/**
 * useSocket – connect to Socket.IO, join rooms, listen for events.
 * Multiple components can call this hook safely; the global socket is shared
 * and NOT disconnected when an individual component unmounts.
 * 
 * Re-connects when token appears in localStorage (after login).
 */
export function useSocket() {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const [trigger, setTrigger] = useState(0);

    // Listen for storage events (login from another tab) and custom login event
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token' && e.newValue) {
                setTrigger(t => t + 1);
            }
        };
        const handleLogin = () => setTrigger(t => t + 1);
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userLoggedIn', handleLogin);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLoggedIn', handleLogin);
        };
    }, []);

    // Also check for token periodically in case login happens in same tab
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !socketRef.current?.connected) {
            setTrigger(t => t + 1);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Clear stale socket ref when logged out
            socketRef.current = null;
            setConnected(false);

            // Check again in 500ms in case we're mid-login
            const checkTimer = setInterval(() => {
                const t = localStorage.getItem('token');
                if (t) {
                    clearInterval(checkTimer);
                    setTrigger(prev => prev + 1);
                }
            }, 500);
            
            // Stop checking after 30 seconds
            setTimeout(() => clearInterval(checkTimer), 30000);
            return () => clearInterval(checkTimer);
        }

        const sock = connectSocket(token);
        socketRef.current = sock;

        // Define handlers
        const onConnect = () => {
            console.log('[useSocket] Socket connected, joining rooms...');
            setConnected(true);
            joinRooms(sock);
        };
        const onDisconnect = () => {
            console.log('[useSocket] Socket disconnected');
            setConnected(false);
        };
        const onReconnect = () => {
            console.log('[useSocket] Socket reconnected, rejoining rooms...');
            setConnected(true);
            joinRooms(sock);
        };

        sock.on('connect', onConnect);
        sock.on('disconnect', onDisconnect);
        sock.on('reconnect', onReconnect);

        // If the socket is ALREADY connected (another hook created it),
        // immediately join rooms and mark as connected.
        if (sock.connected) {
            console.log('[useSocket] Socket already connected, joining rooms...');
            setConnected(true);
            joinRooms(sock);
        }

        return () => {
            // Only remove THIS hook's handlers; do NOT disconnect the global socket.
            sock.off('connect', onConnect);
            sock.off('disconnect', onDisconnect);
            sock.off('reconnect', onReconnect);
            releaseSocket();
        };
    }, [trigger]);

    return { socket: socketRef.current || getSocket(), connected };
}

/**
 * useAnimatedCounter – smoothly animate a number.
 */
export function useAnimatedCounter(target, duration = 600) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0 || typeof target === 'string') {
            setCount(target);
            return;
        }
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);

    return count;
}
