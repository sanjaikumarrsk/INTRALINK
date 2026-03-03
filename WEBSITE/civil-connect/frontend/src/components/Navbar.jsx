import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FiBell, FiMenu, FiX, FiUser } from 'react-icons/fi';
import { useState } from 'react';

export default function Navbar() {
    const { user, logoutUser } = useAuth();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);

    const handleLogout = () => { logoutUser(); navigate('/'); setMobileOpen(false); };

    const nl = (to, label) => (
        <NavLink to={to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:text-white hover:bg-white/10'}`
            }>{label}</NavLink>
    );

    return (
        <>
            {/* Top stripe */}
            <div className="bg-saffron h-1.5 w-full" />
            <nav className="bg-navy text-white shadow-md no-print">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-navy font-bold text-lg shadow">IL</div>
                        <div className="leading-tight">
                            <div className="font-bold text-base tracking-wide">INFRALINK</div>
                            <div className="text-[10px] text-blue-200 tracking-wider uppercase">Smart Civic & Disaster Governance</div>
                        </div>
                    </Link>

                    {/* Desktop links — role-specific */}
                    <div className="hidden md:flex items-center gap-1">
                        {nl('/', 'Home')}
                        {user && user.role === 'user' && nl('/dashboard', 'Dashboard')}
                        {user && user.role === 'user' && nl('/map', 'Map')}
                        {user && user.role === 'ward_authority' && nl('/authority', 'Authority')}
                        {user && user.role === 'ward_authority' && nl('/map', 'Map')}
                        {user && user.role === 'higher_authority' && nl('/higher', 'Overview')}
                        {user && user.role === 'higher_authority' && nl('/map', 'Map')}
                        {user && user.role === 'admin' && nl('/admin', 'Admin Panel')}
                        {user && user.role === 'admin' && nl('/user-management', 'Users')}
                        {user && user.role === 'admin' && nl('/analytics', 'Analytics')}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        {/* Notification bell */}
                        {user && (
                            <div className="relative">
                                <button onClick={() => setBellOpen(!bellOpen)} className="relative p-2 rounded hover:bg-white/10 transition-colors">
                                    <FiBell size={18} />
                                    {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-saffron text-[10px] font-bold rounded-full flex items-center justify-center text-navy">{unreadCount}</span>}
                                </button>
                                {bellOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                                        <div className="absolute right-0 top-12 w-80 bg-white text-text rounded-lg shadow-xl border border-border z-50 max-h-96 overflow-hidden flex flex-col">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                                <span className="font-semibold text-sm">Notifications</span>
                                                {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-navy hover:underline">Mark all read</button>}
                                            </div>
                                            <div className="overflow-y-auto flex-1">
                                                {notifications.length === 0 ? (
                                                    <p className="p-4 text-sm text-text-muted text-center">No notifications</p>
                                                ) : notifications.slice(0, 5).map(n => (
                                                    <div key={n._id} onClick={() => { if (!n.read) markRead(n._id); }}
                                                        className={`px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-bg text-sm ${!n.read ? 'bg-blue-50/60 border-l-2 border-l-navy' : ''}`}>
                                                        <p className="text-text">{n.message}</p>
                                                        <p className="text-xs text-text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <Link to="/notifications" onClick={() => setBellOpen(false)}
                                                className="block text-center text-xs text-navy font-medium py-2.5 border-t border-border hover:bg-bg">
                                                View all notifications
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Profile link */}
                        {user && (
                            <Link to="/profile" className="p-2 rounded hover:bg-white/10 transition-colors hidden md:block">
                                <FiUser size={18} />
                            </Link>
                        )}

                        {/* Auth buttons */}
                        {!user ? (
                            <div className="hidden md:flex items-center gap-2">
                                <Link to="/login" className="px-4 py-1.5 text-sm rounded border border-white/30 hover:bg-white/10 transition-colors">Login</Link>
                                <Link to="/register" className="px-4 py-1.5 text-sm rounded bg-saffron text-navy font-semibold hover:bg-saffron-dark transition-colors">Register</Link>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="leading-tight">
                                        <span className="text-xs text-white font-medium block">{user.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold inline-block mt-0.5 ${
                                            user.role === 'admin' ? 'bg-red-500/80 text-white' :
                                            user.role === 'higher_authority' ? 'bg-orange-400/80 text-white' :
                                            user.role === 'ward_authority' ? 'bg-yellow-400/80 text-navy' :
                                            'bg-green-400/80 text-navy'
                                        }`}>{user.role.replace(/_/g, ' ').toUpperCase()}</span>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="px-3 py-1.5 text-sm rounded border border-white/30 hover:bg-white/10 transition-colors">Logout</button>
                            </div>
                        )}

                        {/* Mobile toggle */}
                        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded hover:bg-white/10">
                            {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-white/10 px-4 pb-4 flex flex-col gap-1">
                        {nl('/', 'Home')}
                        {user && user.role === 'user' && nl('/dashboard', 'Dashboard')}
                        {user && user.role === 'user' && nl('/map', 'Map')}
                        {user && user.role === 'ward_authority' && nl('/authority', 'Authority')}
                        {user && user.role === 'ward_authority' && nl('/map', 'Map Control')}
                        {user && user.role === 'higher_authority' && nl('/higher', 'Overview')}
                        {user && user.role === 'higher_authority' && nl('/map', 'Map')}
                        {user && user.role === 'admin' && nl('/admin', 'Admin Panel')}
                        {user && user.role === 'admin' && nl('/user-management', 'Users')}
                        {user && user.role === 'admin' && nl('/analytics', 'Analytics')}
                        {user && nl('/notifications', 'Notifications')}
                        {user && nl('/profile', 'Profile')}
                        <div className="border-t border-white/10 mt-2 pt-2">
                            {!user ? (
                                <>
                                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-blue-100">Login</Link>
                                    <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-saffron font-semibold">Register</Link>
                                </>
                            ) : (
                                <button onClick={handleLogout} className="py-2 text-sm text-blue-100">Logout ({user.name})</button>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            {/* Bottom accent */}
            <div className="bg-green-gov h-1 w-full no-print" />
        </>
    );
}
