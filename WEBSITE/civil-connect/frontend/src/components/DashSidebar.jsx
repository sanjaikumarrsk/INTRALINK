import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiGrid, FiFileText, FiMap, FiAward, FiUsers, FiBarChart2,
    FiShield, FiAlertTriangle, FiPlusCircle, FiBell, FiUser, FiEye, FiCheckSquare, FiClipboard
} from 'react-icons/fi';

export default function DashSidebar() {
    const { user } = useAuth();
    if (!user) return null;

    const link = (to, icon, label) => (
        <NavLink to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-navy text-white shadow-sm' : 'text-text-secondary hover:bg-navy/5 hover:text-navy'}`
            }>
            {icon}{label}
        </NavLink>
    );

    const roleBadge = () => {
        const map = {
            admin: { label: 'Admin', color: 'bg-red-100 text-red-700 border-red-200' },
            higher_authority: { label: 'Higher Authority', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            ward_authority: { label: 'Ward Authority', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            user: { label: 'Citizen', color: 'bg-green-100 text-green-700 border-green-200' },
        };
        const r = map[user.role] || map.user;
        return (
            <div className="px-4 py-3 border-b border-border/50 mb-2">
                <p className="text-sm font-semibold text-text truncate">{user.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block mt-1 ${r.color}`}>{r.label}</span>
                {user.ward && <p className="text-[10px] text-text-muted mt-1">{user.ward}</p>}
            </div>
        );
    };

    /* ── Role-specific menu definitions ── */
    const menus = {
        user: (
            <>
                <p className="text-[10px] uppercase tracking-widest text-text-muted px-4 pt-1 pb-2 font-semibold">Citizen</p>
                {link('/dashboard', <FiGrid size={16} />, 'Dashboard')}
                {link('/report', <FiPlusCircle size={16} />, 'Report Issue')}
                {link('/my-reports', <FiClipboard size={16} />, 'My Reports')}
                {link('/issues', <FiFileText size={16} />, 'All Issues')}
                {link('/map', <FiMap size={16} />, 'Map')}
                {link('/notifications', <FiBell size={16} />, 'Notifications')}
                {link('/profile', <FiUser size={16} />, 'Profile')}
            </>
        ),
        ward_authority: (
            <>
                <p className="text-[10px] uppercase tracking-widest text-text-muted px-4 pt-1 pb-2 font-semibold">Ward Authority</p>
                {link('/authority', <FiShield size={16} />, 'Authority Dashboard')}
                {link('/issues', <FiFileText size={16} />, 'All Reports')}
                {link('/map', <FiMap size={16} />, 'Map Control')}
                {link('/notifications', <FiBell size={16} />, 'Notifications')}
                {link('/profile', <FiUser size={16} />, 'Profile')}
            </>
        ),
        higher_authority: (
            <>
                <p className="text-[10px] uppercase tracking-widest text-text-muted px-4 pt-1 pb-2 font-semibold">Higher Authority</p>
                {link('/higher', <FiEye size={16} />, 'Higher Dashboard')}
                {link('/issues', <FiFileText size={16} />, 'All Reports')}
                {link('/map', <FiMap size={16} />, 'Map Overview')}
                {link('/analytics', <FiBarChart2 size={16} />, 'Analytics')}
                {link('/notifications', <FiBell size={16} />, 'Notifications')}
                {link('/profile', <FiUser size={16} />, 'Profile')}
            </>
        ),
        admin: (
            <>
                <p className="text-[10px] uppercase tracking-widest text-text-muted px-4 pt-1 pb-2 font-semibold">Administration</p>
                {link('/admin', <FiBarChart2 size={16} />, 'Admin Panel')}
                {link('/issues', <FiFileText size={16} />, 'All Reports')}
                {link('/map', <FiMap size={16} />, 'Map')}
                {link('/user-management', <FiUsers size={16} />, 'Users')}
                {link('/analytics', <FiAlertTriangle size={16} />, 'Analytics')}
                {link('/notifications', <FiBell size={16} />, 'Notifications')}
                {link('/profile', <FiUser size={16} />, 'Profile')}
            </>
        ),
    };

    return (
        <aside className="w-56 shrink-0 hidden lg:block no-print">
            <div className="sticky top-4 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                {roleBadge()}
                <div className="p-3 space-y-1">
                    {menus[user.role] || menus.user}
                </div>
            </div>
        </aside>
    );
}
