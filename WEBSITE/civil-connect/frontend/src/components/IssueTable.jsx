import { useNavigate } from 'react-router-dom';

const S = { pending:'bg-red-50 text-danger', in_progress:'bg-saffron/10 text-saffron-dark', solved:'bg-green-50 text-green-gov', escalated:'bg-purple/10 text-purple', closed:'bg-navy/10 text-navy', reopened:'bg-red-50 text-danger' };
const SL = { pending:'Pending', in_progress:'In Progress', solved:'Solved', escalated:'Escalated', closed:'Closed', reopened:'Reopened' };
const CL = { garbage:'Garbage', road_damage:'Road Damage', water_leakage:'Water Leakage', streetlight:'Streetlight', drainage:'Drainage', tree_fallen:'Tree Fallen', fire_hazard:'Fire Hazard', flooding:'Flooding', other:'Other' };

export default function IssueTable({ issues }) {
  const nav = useNavigate();
  if (!issues?.length) return <div className="text-center py-12 text-text-muted text-sm">No issues found</div>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
            <th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Ward</th>
            <th className="px-4 py-3">Status</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(i => (
            <tr key={i._id} onClick={() => nav(`/issues/${i._id}`)} className="border-t border-border/50 hover:bg-gray-50 cursor-pointer transition-colors">
              <td className="px-4 py-3 font-medium max-w-[200px] truncate">{i.title}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-text-secondary">{CL[i.category]||i.category}</span></td>
              <td className="px-4 py-3 text-text-secondary">{i.ward||'\u2014'}</td>
              <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${S[i.status]}`}>{SL[i.status]}</span></td>
              <td className="px-4 py-3 text-text-secondary">{i.reportedBy?.name||i.reporter?.name||i.reporterName||'Anonymous'}</td>
              <td className="px-4 py-3 text-text-muted whitespace-nowrap">{new Date(i.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
