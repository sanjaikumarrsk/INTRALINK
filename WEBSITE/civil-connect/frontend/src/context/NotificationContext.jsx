import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [zones, setZones] = useState([]);
    const { socket, connected } = useSocket();
    const [authTrigger, setAuthTrigger] = useState(0);

    // Listen for login/logout events to re-fetch notifications
    useEffect(() => {
        const handleLogin = () => setAuthTrigger(t => t + 1);
        const handleLogout = () => {
            setNotifications([]);
            setZones([]);
        };
        window.addEventListener('userLoggedIn', handleLogin);
        window.addEventListener('userLoggedOut', handleLogout);
        return () => {
            window.removeEventListener('userLoggedIn', handleLogin);
            window.removeEventListener('userLoggedOut', handleLogout);
        };
    }, []);

    // Fetch notifications from API on mount AND after login
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setNotifications([]);
            return;
        }
        getNotifications()
            .then(res => {
                // Normalize notification types to lowercase for consistent filtering
                const normalized = (Array.isArray(res.data) ? res.data : []).map(n => ({
                    ...n,
                    type: (n.type || 'general').toLowerCase(),
                    severity: (n.severity || 'info').toLowerCase(),
                }));
                setNotifications(normalized);
            })
            .catch(() => {});
    }, [authTrigger]);

    // Listen for real-time socket events — re-register whenever socket or connection state changes
    useEffect(() => {
        if (!socket) return;
        console.log('[NotificationContext] Registering socket listeners, connected:', socket.connected);

        const handleZoneUpdate = (data) => {
            const sev = (data.severity || '').toUpperCase();
            const severityMap = { RED: 'critical', ORANGE: 'warning', YELLOW: 'moderate', GREEN: 'info' };
            const labelMap = {
                RED: 'Red Zone (Critical Risk)',
                ORANGE: 'Orange Zone (High Risk)',
                YELLOW: 'Yellow Zone (Warning)',
                GREEN: 'Green Zone (Safe)',
            };
            const msg = data.message || `${labelMap[sev] || 'Zone Alert'} declared at ${data.areaName || 'Unknown Area'} — ${data.disasterType || ''}`;

            if (sev === 'RED') {
                toast.error(msg, { autoClose: 8000 });
                try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHjGR0teleU07TH+4zMKCQSAzb7XJ1JVPKzZdl8TOnm1CPUuBt83LikMkN2+zy86fXzI7');
                    audio.volume = 0.3;
                    audio.play().catch(() => {});
                } catch (e) {}
            } else if (sev === 'ORANGE') {
                toast.warning(msg, { autoClose: 5000 });
            } else {
                toast.info(msg, { autoClose: 4000 });
            }

            addNotification({ message: msg, severity: severityMap[sev] || 'info', type: 'zone' });

            // Update zones list if zone data is included
            if (data._id && data.lat && data.lng) {
                setZones(prev => {
                    const idx = prev.findIndex(z => z._id === data._id);
                    if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = { ...updated[idx], ...data };
                        return updated;
                    }
                    return [data, ...prev];
                });
            }
        };

        const handleWardAlert = (data) => {
            toast.info(`Ward Alert: ${data.message || 'New activity in your ward'}`, { autoClose: 6000 });
        };

        const handleNotification = (data) => {
            // Normalize type to lowercase for consistent filtering
            const normalizedData = {
                ...data,
                type: (data.type || 'general').toLowerCase(),
                severity: (data.severity || 'info').toLowerCase(),
            };
            addNotification(normalizedData);
            toast.info(data.message || 'New notification', { autoClose: 4000 });
        };

        socket.on('zoneUpdate', handleZoneUpdate);
        socket.on('zoneUpdated', handleZoneUpdate);
        socket.on('wardAlert', handleWardAlert);
        socket.on('notification', handleNotification);

        /* Issue events */
        const handleNewReport = (data) => {
            const msg = `New report: ${data.title || 'Issue reported'}${data.ward ? ` in ${data.ward}` : ''}`;
            toast.info(msg, { autoClose: 4000 });
            addNotification({ message: msg, severity: 'info', type: 'report' });
        };
        const handleIssueUpdated = (data) => {
            const msg = `Issue updated: ${data.title || 'Issue'} → ${(data.status || '').replace('_', ' ')}`;
            toast.info(msg, { autoClose: 3000 });
            addNotification({ message: msg, severity: 'info', type: 'status_update' });
        };

        socket.on('newReport', handleNewReport);
        socket.on('newIssue', handleNewReport);
        socket.on('issueUpdated', handleIssueUpdated);

        /* Live status update for user's own issues */
        const handleStatusUpdate = (data) => {
            const msg = `Your issue "${data.title || 'Issue'}" status changed to ${(data.status || '').replace('_', ' ')}`;
            toast.success(msg, { autoClose: 5000 });
            addNotification({ message: msg, severity: 'info', type: 'status_update' });
        };
        socket.on('statusUpdate', handleStatusUpdate);

        /* Broadcast notification (dedicated event for reliability) */
        const handleBroadcastNotification = (data) => {
            // Normalize type to lowercase for consistent filtering
            const normalizedData = {
                ...data,
                type: (data.type || 'announcement').toLowerCase(),
                severity: (data.severity || 'info').toLowerCase(),
            };
            addNotification(normalizedData);
            toast.info(data.message || 'New broadcast', { autoClose: 5000 });
        };
        socket.on('broadcastNotification', handleBroadcastNotification);

        /* Socket alive test */
        const handleSocketTest = (data) => {
            console.log('[SocketTest]', data);
        };
        socket.on('socketTest', handleSocketTest);

        return () => {
            socket.off('zoneUpdate', handleZoneUpdate);
            socket.off('zoneUpdated', handleZoneUpdate);
            socket.off('wardAlert', handleWardAlert);
            socket.off('notification', handleNotification);
            socket.off('newReport', handleNewReport);
            socket.off('newIssue', handleNewReport);
            socket.off('issueUpdated', handleIssueUpdated);
            socket.off('statusUpdate', handleStatusUpdate);
            socket.off('broadcastNotification', handleBroadcastNotification);
            socket.off('socketTest', handleSocketTest);
        };
    }, [socket, connected]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((notif) => {
        setNotifications(prev => [
            { _id: 'n' + Date.now() + Math.random(), read: false, createdAt: new Date().toISOString(), ...notif },
            ...prev,
        ]);
    }, []);

    const addZone = useCallback((zone) => {
        const id = 'z' + Date.now();
        const severityMap = { red: 'critical', orange: 'warning', yellow: 'moderate' };
        const labelMap = { red: 'Red Zone (Critical Risk)', orange: 'Orange Zone (High Risk)', yellow: 'Yellow Zone (Moderate Risk)' };
        const newZone = { _id: id, ...zone, createdAt: new Date().toISOString() };
        setZones(prev => [...prev, newZone]);
        addNotification({
            message: `${labelMap[zone.type]} declared at ${zone.areaName}`,
            severity: severityMap[zone.type],
            type: 'zone',
            zoneId: id,
            zoneType: zone.type,
            areaName: zone.areaName,
        });
    }, [addNotification]);

    const markRead = useCallback((id) => {
        markNotificationRead(id).catch(() => {});
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        markAllNotificationsRead().catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications, zones, unreadCount,
            addNotification, addZone, markRead, markAllRead, clearAll,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);
