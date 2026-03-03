import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { createNotification } from '../services/api';
import { toast } from 'react-toastify';
import { FiBell, FiCheck, FiTrash2, FiFilter, FiSend } from 'react-icons/fi';

const SEVERITY_BADGE = {
    critical: 'bg-danger/10 text-danger border-danger/30',
    warning: 'bg-saffron/10 text-saffron-dark border-saffron/30',
    moderate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    info: 'bg-blue-50 text-navy border-navy/20',
};
const SEVERITY_LABEL = { critical: 'Critical', warning: 'Warning', moderate: 'Moderate', info: 'Info' };

export default function Notifications() {
    const { user } = useAuth();
    const { notifications, markRead, markAllRead, clearAll, unreadCount } = useNotifications();
    const [filter, setFilter] = useState('all'); // all | zone | report | issue
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcast, setBroadcast] = useState({ title: '', message: '', target: 'ALL', ward: '' });
    const [sending, setSending] = useState(false);

    const isAuthority = user && ['admin', 'higher_authority', 'ward_authority'].includes(user.role);

    const filtered = notifications.filter(n => {
        const type = (n.type || '').toLowerCase();
        if (filter === 'zone') return type === 'zone';
        if (filter === 'report') return type === 'report' || type === 'status_update';
        if (filter === 'issue') return type === 'issue' || type === 'general' || type === 'announcement' || !type;
        return true;
    });

    const handleBroadcast = async () => {
        if (!broadcast.message.trim()) return;
        setSending(true);
        try {
            const payload = {
                title: broadcast.title || 'Announcement',
                message: broadcast.message,
                type: 'ANNOUNCEMENT',
                severity: 'info',
                roleTarget: broadcast.target === 'WARD' ? 'USER' : broadcast.target,
                ward: broadcast.target === 'WARD' ? broadcast.ward : undefined,
            };
            await createNotification(payload);
            toast.success('Broadcast sent successfully');
            setBroadcast({ title: '', message: '', target: 'ALL', ward: '' });
            setShowBroadcast(false);
        } catch (err) {
            toast.error('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Notifications</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isAuthority && (
                        <button onClick={() => setShowBroadcast(!showBroadcast)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy text-white hover:bg-navy-dark transition-colors">
                            <FiSend size={12} /> Broadcast
                        </button>
                    )}
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:border-navy hover:text-navy transition-colors">
                            <FiCheck size={12} /> Mark all read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={clearAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-danger/30 text-danger hover:bg-danger/5 transition-colors">
                            <FiTrash2 size={12} /> Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Broadcast form (authorities only) */}
            {showBroadcast && isAuthority && (
                <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
                    <h3 className="font-semibold text-sm text-navy mb-3">Send Broadcast Announcement</h3>
                    <input type="text" value={broadcast.title} onChange={e => setBroadcast(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notification title..."
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 mb-3" />
                    <textarea rows={3} value={broadcast.message} onChange={e => setBroadcast(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Type your announcement message..."
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none mb-3" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Target Audience</label>
                            <select value={broadcast.target} onChange={e => setBroadcast(prev => ({ ...prev, target: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                                <option value="ALL">All Users</option>
                                <option value="USER">All Citizens</option>
                                <option value="WARD_AUTHORITY">All Ward Authorities</option>
                                <option value="HIGHER_AUTHORITY">Higher Authorities</option>
                                <option value="WARD">Specific Ward</option>
                            </select>
                        </div>
                        {broadcast.target === 'WARD' && (
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Select Ward</label>
                                <select value={broadcast.ward} onChange={e => setBroadcast(prev => ({ ...prev, ward: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                                    <option value="">Select ward...</option>
                                    {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={`Ward ${i+1}`}>Ward {i+1}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleBroadcast} disabled={sending || !broadcast.message.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-navy text-white hover:bg-navy-dark transition-colors disabled:opacity-40">
                            <FiSend size={12} />{sending ? 'Sending...' : 'Send Broadcast'}
                        </button>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-1 mb-6 bg-white rounded-lg border border-border p-1 w-fit">
                {[['all', 'All'], ['zone', 'Zones'], ['report', 'Reports'], ['issue', 'General']].map(([key, label]) => (
                    <button key={key} onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors ${filter === key ? 'bg-navy text-white shadow-sm' : 'text-text-secondary hover:text-text hover:bg-gray-50'}`}>
                        {key === 'all' && <FiBell size={14} />}
                        {key === 'zone' && <FiFilter size={14} />}
                        {label}
                    </button>
                ))}
            </div>

            {/* Notifications list */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-text-muted text-sm">
                        <FiBell size={32} className="mx-auto mb-3 opacity-30" />
                        <p>No notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filtered.map(n => (
                            <div key={n._id}
                                onClick={() => !n.read && markRead(n._id)}
                                className={`px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-4 ${!n.read ? 'bg-blue-50/40 border-l-2 border-l-navy' : ''}`}>
                                {/* Severity dot */}
                                <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${n.severity === 'critical' ? 'bg-danger' : n.severity === 'warning' ? 'bg-saffron' : n.severity === 'moderate' ? 'bg-yellow-500' : 'bg-navy'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!n.read ? 'font-medium text-text' : 'text-text-secondary'}`}>{n.message}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${SEVERITY_BADGE[n.severity] || SEVERITY_BADGE.info}`}>
                                            {SEVERITY_LABEL[n.severity] || 'Info'}
                                        </span>
                                        {(n.type || '').toLowerCase() === 'zone' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple/10 text-purple border border-purple/20">Zone Alert</span>
                                        )}
                                        {((n.type || '').toLowerCase() === 'report' || (n.type || '').toLowerCase() === 'status_update') && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-navy/10 text-navy border border-navy/20">Report</span>
                                        )}
                                        {(n.type || '').toLowerCase() === 'announcement' && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-saffron/10 text-saffron-dark border border-saffron/20">Announcement</span>
                                        )}
                                        <span className="text-xs text-text-muted">{new Date(n.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                {!n.read && (
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-navy shrink-0" title="Unread" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
