import { useState } from 'react';
import { FiBell, FiX, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function TopBar({ onMenuClick }) {
    const { user } = useAuth();
    const { notifications, markRead, markAllRead } = useNotifications();
    const [panelOpen, setPanelOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.read).length;

    const timeAgo = (date) => {
        const diff = (Date.now() - new Date(date)) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <>
            <div className="mobile-header">
                <button className="hamburger" onClick={onMenuClick}>
                    <FiMenu />
                </button>
                <h3 style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    INFRALINK
                </h3>
                {user && (
                    <button className="hamburger" onClick={() => setPanelOpen(true)} style={{ position: 'relative' }}>
                        <FiBell />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>
                )}
            </div>

            {/* Desktop notification bell */}
            {user && (
                <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 99 }}>
                    <button
                        className="btn btn-outline btn-icon"
                        onClick={() => setPanelOpen(true)}
                        style={{ position: 'relative' }}
                    >
                        <FiBell size={20} />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>
                </div>
            )}

            {/* Notification panel */}
            {panelOpen && <div className="overlay" onClick={() => setPanelOpen(false)} />}
            <div className={`notification-panel ${panelOpen ? 'open' : ''}`}>
                <div className="notification-header">
                    <h3>Notifications</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {unreadCount > 0 && (
                            <button className="btn btn-sm btn-outline" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                        <button className="btn btn-icon btn-outline" onClick={() => setPanelOpen(false)}>
                            <FiX />
                        </button>
                    </div>
                </div>
                <div className="notification-list">
                    {notifications.length === 0 ? (
                        <div className="empty-state">No notifications yet</div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                className={`notification-item ${!n.read ? 'unread' : ''}`}
                                onClick={() => markRead(n._id)}
                            >
                                <div>{n.message}</div>
                                <div className="time">{timeAgo(n.createdAt)}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
