import { FiClock, FiUser, FiImage, FiFileText } from 'react-icons/fi';

const STATUS_COLORS = {
  pending: 'bg-gray-400',
  in_progress: 'bg-saffron-dark',
  solved: 'bg-green-gov',
  escalated: 'bg-purple',
  closed: 'bg-navy',
  reopened: 'bg-danger',
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  solved: 'Solved',
  escalated: 'Escalated',
  closed: 'Closed',
  reopened: 'Reopened',
};

export default function StatusTimeline({ statusHistory = [] }) {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-sm">
        No status history available
      </div>
    );
  }

  // Sort by changedAt ascending (oldest first)
  const sorted = [...statusHistory].sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-border" />

      <div className="space-y-0">
        {sorted.map((entry, index) => (
          <div key={index} className="relative flex gap-4 pb-5 last:pb-0">
            {/* Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full ${STATUS_COLORS[entry.status] || 'bg-gray-400'} flex items-center justify-center shadow-sm`}>
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-border p-4 shadow-sm min-w-0">
              {/* Status badge & timestamp */}
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${STATUS_COLORS[entry.status] || 'bg-gray-400'}`}>
                  {STATUS_LABELS[entry.status] || entry.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <FiClock size={11} />
                  {new Date(entry.changedAt).toLocaleString()}
                </span>
              </div>

              {/* Who changed it */}
              {entry.changedBy && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1.5">
                  <FiUser size={12} />
                  <span className="font-medium">{entry.changedBy?.name || 'System'}</span>
                  {entry.changedBy?.role && (
                    <span className="text-text-muted">({entry.changedBy.role.replace('_', ' ')})</span>
                  )}
                </div>
              )}

              {/* Note */}
              {entry.note && (
                <div className="flex items-start gap-1.5 text-sm text-text-secondary mt-2">
                  <FiFileText size={13} className="mt-0.5 shrink-0 text-text-muted" />
                  <p className="leading-relaxed">{entry.note}</p>
                </div>
              )}

              {/* Proof image */}
              {entry.proofImage && (
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                    <FiImage size={12} /> Proof Image
                  </div>
                  <img
                    src={`/uploads/${entry.proofImage}`}
                    alt="Proof"
                    className="rounded-lg border border-border max-h-40 object-cover w-full"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
