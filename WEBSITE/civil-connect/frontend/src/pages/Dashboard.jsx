import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIssues, getIssueStats } from '../services/api';
import StatCard from '../components/StatCard';
import IssueTable from '../components/IssueTable';
import { FiFileText, FiClock, FiLoader, FiCheckCircle, FiAward, FiAlertTriangle } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ totalReports: 0, pendingCount: 0, inProgressCount: 0, solvedCount: 0, escalatedCount: 0 });

  useEffect(() => {
    getIssueStats()
      .then(res => { if (res.data) setStats(res.data); })
      .catch(() => {});

    getIssues()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setIssues(data);
      })
      .catch(() => {});
  }, []);

  const recent = [...issues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Citizen Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Welcome back, {user?.name}. Here is a summary of your reports.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Reports" value={stats.totalReports} icon={<FiFileText size={20}/>} variant="navy" />
        <StatCard label="Solved" value={stats.solvedCount} icon={<FiCheckCircle size={20}/>} variant="green" />
        <StatCard label="Pending" value={stats.pendingCount} icon={<FiClock size={20}/>} variant="red" />
        <StatCard label="In Progress" value={stats.inProgressCount} icon={<FiLoader size={20}/>} variant="cyan" />
        <StatCard label="Escalated" value={stats.escalatedCount} icon={<FiAlertTriangle size={20}/>} variant="saffron" />
        <StatCard label="Points Earned" value={user?.points || 0} icon={<FiAward size={20}/>} variant="green" />
      </div>

      {/* Recent Complaints */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-text mb-3">Recent Complaints</h2>
        <IssueTable issues={recent} />
      </div>
    </div>
  );
}
