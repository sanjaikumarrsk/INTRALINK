import { io } from 'socket.io-client';

let socket = null;
let refCount = 0;

// Connect via same-origin so Vite proxy handles /socket.io in dev,
// and in production it goes directly to the server.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const connectSocket = (token) => {
    refCount++;

    // If socket exists, is connected, and has the same token — reuse it
    if (socket && socket.connected && socket.auth?.token === token) {
        return socket;
    }

    // Clean up any stale or differently-authenticated socket
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
        console.log('[Socket] Connection error:', err.message);
    });

    return socket;
};

export const getSocket = () => socket;

// Release a reference. Only truly disconnect when no components need the socket.
export const releaseSocket = () => {
    refCount = Math.max(0, refCount - 1);
};

// Force disconnect (used on logout)
export const disconnectSocket = () => {
    refCount = 0;
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
};
