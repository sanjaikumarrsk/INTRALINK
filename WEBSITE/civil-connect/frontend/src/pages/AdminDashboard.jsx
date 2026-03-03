import { useState, useEffect } from 'react';
import { getIssues, getUsers, assignAuthority, getIssueStats } from '../services/api';
import StatCard from '../components/StatCard';
import { toast } from 'react-toastify';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiFileText, FiUsers, FiAlertTriangle, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
    const [issues, setIssues] = useState([]);
    const [users, setUsers] = useState([]);
    const [assignModal, setAssignModal] = useState(null);
    const [assignUserId, setAssignUserId] = useState('');
    const [stats, setStats] = useState({ totalReports: 0, pendingCount: 0, inProgressCount: 0, solvedCount: 0, escalatedCount: 0, wardWiseCounts: [] });

    useEffect(() => {
        getIssueStats().then(res => { if (res.data) setStats(res.data); }).catch(() => {});
        getIssues().then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            setIssues(data);
        }).catch(() => {});
        getUsers().then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            setUsers(data);
        }).catch(() => {});
    }, []);

    const authorities = users.filter(u => ['WARD_AUTHORITY', 'ADMIN', 'HIGHER_AUTHORITY', 'ward_authority', 'admin', 'higher_authority'].includes(u.role));
    const wardEntries = (stats.wardWiseCounts || []).map(w => [w._id, { total: w.total, pending: w.pending, in_progress: w.in_progress, solved: w.solved, escalated: w.escalated }]);

    const escalated = issues.filter(i => i.status === 'escalated');

    // Chart data
    const chartColors = { Navy: '#0B3D91', Saffron: '#FF9933', Green: '#138808', Red: '#DC2626', Purple: '#7C3AED' };
    const statusData = {
        labels: ['Pending', 'In Progress', 'Solved', 'Escalated'],
        datasets: [{
            data: [stats.pendingCount, stats.inProgressCount, stats.solvedCount, stats.escalatedCount],
            backgroundColor: [chartColors.Red, chartColors.Saffron, chartColors.Green, chartColors.Purple],
        }]
    };

    const topWards = wardEntries.slice(0, 10);
    const wardBarData = {
        labels: topWards.map(([w]) => w || 'Unknown'),
        datasets: [
            { label: 'Solved', data: topWards.map(([, s]) => s.solved), backgroundColor: chartColors.Green },
            { label: 'Pending', data: topWards.map(([, s]) => s.pending), backgroundColor: chartColors.Red },
            { label: 'In Progress', data: topWards.map(([, s]) => s.in_progress), backgroundColor: chartColors.Saffron },
        ]
    };

    const handleAssign = async (issueId) => {
        if (!assignUserId) return;
        try {
            await assignAuthority(issueId, { authorityId: assignUserId });
            toast.success('Authority assigned');
            setAssignModal(null);
            setAssignUserId('');
            getIssues().then(res => setIssues(res.data)).catch(() => {});
        } catch (err) {
            toast.error('Failed to assign authority');
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
                <p className="text-sm text-text-secondary mt-1">System-wide performance, authority management, and analytics.</p>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard label="Total Issues" value={stats.totalReports} icon={<FiFileText size={18} />} variant="navy" />
                <StatCard label="Total Users" value={users.length} icon={<FiUsers size={18} />} variant="cyan" />
                <StatCard label="Authorities" value={authorities.length} icon={<FiUsers size={18} />} variant="green" />
                <StatCard label="Escalated" value={stats.escalatedCount} icon={<FiAlertTriangle size={18} />} variant="red" />
                <StatCard label="Wards Active" value={wardEntries.length} icon={<FiBarChart2 size={18} />} variant="saffron" />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-sm mb-4">Issue Status Distribution</h3>
                    <div className="max-w-[250px] mx-auto">
                        <Doughnut data={statusData} options={{ plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } } } }} />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-sm mb-4">Ward Performance</h3>
                    <Bar data={wardBarData} options={{ responsive: true, plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }} />
                </div>
            </div>

            {/* Ward Performance Table */}
            <div className="bg-white rounded-xl border border-border shadow-sm mb-6 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">All Wards Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/50 text-left text-xs uppercase tracking-wider text-text-secondary">
                                <th className="px-4 py-3">Ward</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3">Pending</th>
                                <th className="px-4 py-3">In Progress</th>
                                <th className="px-4 py-3">Solved</th>
                                <th className="px-4 py-3">Escalated</th>
                                <th className="px-4 py-3">Resolution %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wardEntries.map(([ward, s]) => (
                                <tr key={ward} className="border-t border-border/50 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{ward || 'Unknown'}</td>
                                    <td className="px-4 py-3">{s.total}</td>
                                    <td className="px-4 py-3 text-danger">{s.pending}</td>
                                    <td className="px-4 py-3 text-saffron-dark">{s.in_progress}</td>
                                    <td className="px-4 py-3 text-green-gov">{s.solved}</td>
                                    <td className="px-4 py-3 text-purple">{s.escalated}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-gov rounded-full" style={{ width: `${s.total ? (s.solved / s.total * 100).toFixed(0) : 0}%` }} />
                                            </div>
                                            <span className="text-xs text-text-muted">{s.total ? (s.solved / s.total * 100).toFixed(0) : 0}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Escalation Management */}
            {escalated.length > 0 && (
                <div className="bg-white rounded-xl border border-border shadow-sm mb-6 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-red-50 flex items-center gap-2">
                        <FiAlertTriangle className="text-danger" size={16} />
                        <h3 className="font-semibold text-sm text-danger">Escalated Issues ({escalated.length})</h3>
                    </div>
                    <div className="divide-y divide-border/50">
                        {escalated.slice(0, 10).map(issue => (
                            <div key={issue._id} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">{issue.title}</p>
                                    <p className="text-xs text-text-muted">{issue.ward || 'Unknown'} · {new Date(issue.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => setAssignModal(issue._id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors">
                                    Assign Authority
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assign modal */}
            {assignModal && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setAssignModal(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl border border-border shadow-xl p-6 max-w-sm w-full">
                            <h3 className="font-semibold text-navy mb-3">Assign Authority</h3>
                            <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30 mb-4">
                                <option value="">Select authority...</option>
                                {authorities.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role.replace('_', ' ')}){a.ward ? ` - Ward ${a.ward}` : ''}</option>)}
                            </select>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-bg">Cancel</button>
                                <button onClick={() => handleAssign(assignModal)} className="px-4 py-2 text-sm rounded-lg bg-navy text-white hover:bg-navy-dark">Assign</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
