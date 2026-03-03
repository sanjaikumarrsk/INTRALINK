import { useState, useEffect } from 'react';
import { getIssues } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueTable from '../components/IssueTable';
import { FiSearch } from 'react-icons/fi';

export default function MyReports() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [allIssues, setAllIssues] = useState([]);

  useEffect(() => {
    getIssues().then(res => setAllIssues(Array.isArray(res.data) ? res.data : [])).catch(() => setAllIssues([]));
  }, []);

  // Filter only issues reported by the logged-in user
  const myIssues = allIssues.filter(i => {
    const reportedById = i.reportedBy?._id || i.reportedBy;
    if (reportedById !== user?.userId) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!i.title.toLowerCase().includes(s) && !i.description.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">My Reports</h1>
        <p className="text-sm text-text-secondary mt-1">Issues you have reported</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14}/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search my reports..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="solved">Solved</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>
        </div>
      </div>

      <div className="text-xs text-text-muted mb-3">{myIssues.length} report{myIssues.length !== 1 ? 's' : ''} found</div>
      <IssueTable issues={myIssues} />
    </div>
  );
}
