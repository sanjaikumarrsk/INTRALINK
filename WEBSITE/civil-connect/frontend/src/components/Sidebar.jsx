import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiAlertCircle, FiMap, FiUsers, FiAward,
    FiSettings, FiLogOut, FiLogIn, FiPlusCircle, FiBarChart2
} from 'react-icons/fi';

export default function Sidebar({ isOpen, onClose }) {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
        onClose?.();
    };

    const link = (to, icon, label, roles = null) => {
        if (roles && (!user || !roles.includes(user.role))) return null;
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
            >
                {icon} {label}
            </NavLink>
        );
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-brand">
                <FiAlertCircle size={28} color="var(--accent)" />
                <h2>INFRALINK</h2>
            </div>

            <nav className="sidebar-nav">
                <span className="sidebar-section">Main</span>
                {link('/', <FiHome />, 'Dashboard')}
                {link('/report', <FiPlusCircle />, 'Report Issue')}
                {link('/control-room', <FiMap />, 'Control Room')}
                {link('/leaderboard', <FiAward />, 'Leaderboard')}

                {user && ['admin', 'higher_authority', 'ward_authority'].includes(user.role) && (
                    <>
                        <span className="sidebar-section">Management</span>
                        {link('/issues', <FiAlertCircle />, 'All Issues', ['admin', 'higher_authority', 'ward_authority'])}
                        {link('/analytics', <FiBarChart2 />, 'Analytics', ['admin', 'higher_authority'])}
                        {link('/user-management', <FiUsers />, 'Users', ['admin', 'higher_authority'])}
                    </>
                )}

                <span className="sidebar-section">Account</span>
                {!user ? (
                    <>
                        {link('/login', <FiLogIn />, 'Login')}
                        {link('/register', <FiPlusCircle />, 'Register')}
                    </>
                ) : (
                    <button className="sidebar-link" onClick={handleLogout}>
                        <FiLogOut /> Logout
                    </button>
                )}
            </nav>

            <div className="sidebar-footer">
                {user ? (
                    <>
                        <strong>{user.name}</strong>
                        <br />
                        <span style={{ textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</span>
                        {user.ward && <> · Ward {user.ward}</>}
                    </>
                ) : (
                    'Guest'
                )}
            </div>
        </aside>
    );
}
