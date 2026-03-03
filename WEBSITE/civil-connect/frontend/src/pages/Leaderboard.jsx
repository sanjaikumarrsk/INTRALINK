import { useState, useEffect } from 'react';
import { getUserLeaderboard, getWardLeaderboard } from '../services/api';
import { FiAward, FiMapPin } from 'react-icons/fi';

export default function Leaderboard() {
  const [citizens, setCitizens] = useState([]);
  const [wards, setWards] = useState([]);
  const [tab, setTab] = useState('wards');

  useEffect(() => {
    getUserLeaderboard().then(res => setCitizens(res.data)).catch(() => {});
    getWardLeaderboard().then(res => setWards(res.data)).catch(() => {});
  }, []);

  const medals = ['bg-saffron text-navy', 'bg-gray-300 text-text', 'bg-orange-300 text-text'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Leaderboard</h1>
        <p className="text-sm text-text-secondary mt-1">Top performing wards and most active citizens</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg border border-border p-1 w-fit">
        {[['wards', 'Top Wards', <FiMapPin key="w" size={14}/>], ['citizens', 'Top Citizens', <FiAward key="c" size={14}/>]].map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors ${tab === key ? 'bg-navy text-white shadow-sm' : 'text-text-secondary hover:text-text hover:bg-gray-50'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'wards' ? (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Total Issues</th>
                <th className="px-4 py-3">Solved</th>
                <th className="px-4 py-3">Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {wards.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted">No ward data available</td></tr>
              ) : wards.map((w, i) => (
                <tr key={w._id || i} className="border-t border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {i < 3 ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${medals[i]}`}>{i + 1}</span>
                    ) : (
                      <span className="text-text-muted font-medium ml-1.5">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{w._id || w.ward || 'Unknown'}</td>
                  <td className="px-4 py-3">{w.total || 0}</td>
                  <td className="px-4 py-3 text-green-gov font-medium">{w.solved || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-gov rounded-full" style={{ width: `${w.total ? ((w.solved||0)/w.total*100).toFixed(0) : 0}%` }}/>
                      </div>
                      <span className="text-xs text-text-muted">{w.total ? ((w.solved||0)/w.total*100).toFixed(0) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Citizen</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Issues Reported</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {citizens.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted">No citizen data available</td></tr>
              ) : citizens.map((c, i) => (
                <tr key={c._id || i} className="border-t border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {i < 3 ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${medals[i]}`}>{i + 1}</span>
                    ) : (
                      <span className="text-text-muted font-medium ml-1.5">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name || 'Anonymous'}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.ward || '\u2014'}</td>
                  <td className="px-4 py-3">{c.issueCount || c.issues || 0}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-saffron/10 text-saffron-dark font-semibold rounded text-xs">{c.points || 0} pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
