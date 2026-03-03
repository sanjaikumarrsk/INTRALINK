import { useState, useEffect } from 'react';
import { getIssues } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueTable from '../components/IssueTable';
import { FiSearch, FiFilter } from 'react-icons/fi';

export default function IssueList() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'my'

  const [allIssues, setAllIssues] = useState([]);

  useEffect(() => {
    getIssues().then(res => setAllIssues(Array.isArray(res.data) ? res.data : [])).catch(() => setAllIssues([]));
  }, []);

  const isUser = user && user.role === 'user';

  const issues = allIssues.filter(i => {
    // My Reports filter: only show issues reported by logged-in user
    if (tab === 'my' && user) {
      const reportedById = i.reportedBy?._id || i.reportedBy;
      if (reportedById !== user.userId) return false;
    }
    if (statusFilter && i.status !== statusFilter) return false;
    if (categoryFilter && i.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!i.title.toLowerCase().includes(s) && !i.description.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">{tab === 'my' ? 'My Reports' : 'All Issues'}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {tab === 'my' ? 'Issues you have reported' : 'Browse and filter all reported civic issues'}
        </p>
      </div>

      {/* All Issues / My Reports tabs — shown to citizens */}
      {isUser && (
        <div className="flex gap-1 mb-4 bg-white rounded-lg border border-border p-1 w-fit">
          <button onClick={() => setTab('all')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${tab === 'all' ? 'bg-navy text-white shadow-sm' : 'text-text-secondary hover:text-text hover:bg-gray-50'}`}>
            All Issues
          </button>
          <button onClick={() => setTab('my')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${tab === 'my' ? 'bg-navy text-white shadow-sm' : 'text-text-secondary hover:text-text hover:bg-gray-50'}`}>
            My Reports
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14}/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search issues..."
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
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">All Categories</option>
              <option value="garbage">Garbage</option>
              <option value="road_damage">Road Damage</option>
              <option value="water_leakage">Water Leakage</option>
              <option value="streetlight">Streetlight</option>
              <option value="drainage">Drainage</option>
              <option value="tree_fallen">Tree Fallen</option>
              <option value="fire_hazard">Fire Hazard</option>
              <option value="flooding">Flooding</option>
              <option value="pothole">Pothole</option>
              <option value="broken_footpath">Broken Footpath</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {(() => (
        <>
          <div className="text-xs text-text-muted mb-3">{issues.length} issue{issues.length !== 1 ? 's' : ''} found</div>
          <IssueTable issues={issues} />
        </>
      ))()}
    </div>
  );
}
