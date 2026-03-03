import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';
import { FiFileText, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import { getIssueStats, getIssues } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Analytics() {
  const [stats, setStats] = useState({ totalReports: 0, pendingCount: 0, inProgressCount: 0, solvedCount: 0, escalatedCount: 0, wardWiseCounts: [], monthlyTrend: [] });
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    getIssueStats().then(res => { if (res.data) setStats(res.data); }).catch(() => {});
    getIssues().then(res => setIssues(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const C = { Navy:'#0B3D91', Saffron:'#FF9933', Green:'#138808', Red:'#DC2626', Purple:'#7C3AED' };

  const statusData = {
    labels: ['Pending', 'In Progress', 'Solved', 'Escalated'],
    datasets: [{ data: [stats.pendingCount, stats.inProgressCount, stats.solvedCount, stats.escalatedCount], backgroundColor: [C.Red, C.Saffron, C.Green, C.Purple] }]
  };

  // Category breakdown from issues
  const catCounts = {};
  issues.forEach(i => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  const catData = {
    labels: Object.keys(catCounts).map(c => c.replace(/_/g, ' ')),
    datasets: [{ label: 'Issues', data: Object.values(catCounts), backgroundColor: C.Navy, borderRadius: 4 }]
  };

  // Monthly trend from stats API
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = {
    labels: (stats.monthlyTrend || []).map(m => monthNames[m._id.month] || m._id.month),
    datasets: [{
      label: 'Issues Reported',
      data: (stats.monthlyTrend || []).map(m => m.count),
      borderColor: C.Navy, backgroundColor: C.Navy + '20', fill: true, tension: 0.3
    }]
  };

  const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">System-wide statistics and trends</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={stats.totalReports} icon={<FiFileText size={18}/>} color="navy" />
        <StatCard label="Pending" value={stats.pendingCount} icon={<FiClock size={18}/>} color="red" />
        <StatCard label="Solved" value={stats.solvedCount} icon={<FiCheckCircle size={18}/>} color="green" />
        <StatCard label="Resolution %" value={stats.totalReports ? Math.round(stats.solvedCount/stats.totalReports*100)+'%' : '0%'} icon={<FiTrendingUp size={18}/>} color="saffron" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Status Distribution</h3>
          <div className="max-w-[220px] mx-auto">
            <Doughnut data={statusData} options={{ plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } } } }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Issues by Category</h3>
          <Bar data={catData} options={chartOpts} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h3 className="font-semibold text-sm mb-4">Monthly Trend (Last 6 Months)</h3>
        <Line data={trendData} options={chartOpts} />
      </div>
    </div>
  );
}
