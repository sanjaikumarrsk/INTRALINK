import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getIssue, updateIssueStatus, addProgressNote, deleteIssue, confirmIssue, reopenIssue } from '../services/api';
import { toast } from 'react-toastify';
import IssueMap from '../components/IssueMap';
import StatusTimeline from '../components/StatusTimeline';
import StatusTransitionModal from '../components/StatusTransitionModal';
import { FiArrowLeft, FiMapPin, FiClock, FiUser, FiTrash2, FiSend, FiCheckCircle, FiRotateCcw, FiAlertTriangle } from 'react-icons/fi';

const SL = { pending:'Pending', in_progress:'In Progress', solved:'Solved', escalated:'Escalated', closed:'Closed', reopened:'Reopened' };
const SC = { pending:'bg-red-50 text-danger border-red-200', in_progress:'bg-saffron/10 text-saffron-dark border-saffron/30', solved:'bg-green-50 text-green-gov border-green-200', escalated:'bg-purple/10 text-purple border-purple/30', closed:'bg-navy/10 text-navy border-navy/30', reopened:'bg-red-50 text-danger border-red-200' };

// Valid transitions per status (for button display)
const VALID_TRANSITIONS = {
  pending: ['in_progress'],
  in_progress: ['solved', 'escalated'],
  escalated: ['in_progress'],
  solved: [], // citizen handles confirm/reopen
  closed: [],
  reopened: ['in_progress'],
};

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(null);
  const [reopenModal, setReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  useEffect(() => {
    getIssue(id)
      .then(res => setIssue(res.data || null))
      .catch(() => setIssue(null))
      .finally(() => setLoading(false));
  }, [id]);

  const isAuthority = user && ['higher_authority','ward_authority'].includes(user.role);
  const canDelete = user && ['admin','higher_authority'].includes(user.role);
  const isCitizen = user && user.role === 'user';
  const isReporter = issue && user && (String(issue.reportedBy?._id || issue.reportedBy) === String(user.userId));

  // Determine which transitions this user can trigger
  const getAvailableTransitions = () => {
    if (!issue || !isAuthority) return [];
    const all = VALID_TRANSITIONS[issue.status] || [];
    // WARD_AUTHORITY cannot manage escalated issues
    if (user.role === 'ward_authority' && issue.status === 'escalated') return [];
    return all;
  };

  const handleStatusModalConfirm = async (formData) => {
    const { data } = await updateIssueStatus(id, formData);
    setIssue(data);
    setModalStatus(null);
    toast.success('Status updated successfully');
  };

  const handleConfirm = async () => {
    try {
      const { data } = await confirmIssue(id);
      setIssue(data);
      toast.success('Issue confirmed as resolved and closed!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm');
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening');
      return;
    }
    setReopenSubmitting(true);
    try {
      const { data } = await reopenIssue(id, { note: reopenReason });
      setIssue(data);
      setReopenModal(false);
      setReopenReason('');
      toast.success('Issue reopened successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reopen');
    } finally {
      setReopenSubmitting(false);
    }
  };

  const handleNote = async () => {
    if (!note.trim()) return;
    try {
      const { data } = await addProgressNote(id, { note });
      setIssue(data);
      setNote('');
      toast.success('Note added');
    } catch (err) { toast.error('Failed to add note'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      await deleteIssue(id);
      toast.success('Issue deleted');
      navigate('/dashboard');
    } catch (err) { toast.error('Failed to delete issue'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-text-muted">Loading...</p>
    </div>
  );

  if (!issue) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-text-muted">Issue not found</p>
    </div>
  );

  const availableTransitions = getAvailableTransitions();

  return (
    <div>
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-navy hover:underline mb-4">
        <FiArrowLeft size={14}/>Back to Dashboard
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-navy">{issue.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><FiUser size={12}/>{issue.reportedBy?.name || issue.reporter?.name || 'Anonymous'}</span>
                  <span className="flex items-center gap-1"><FiClock size={12}/>{new Date(issue.createdAt).toLocaleString()}</span>
                  {issue.ward && <span className="flex items-center gap-1"><FiMapPin size={12}/>{issue.ward}</span>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${SC[issue.status]}`}>{SL[issue.status]}</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">{issue.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 bg-gray-100 rounded">{issue.category?.replace('_',' ')}</span>
              {issue.resolvedAt && <span className="px-2 py-0.5 bg-green-50 text-green-gov rounded">Resolved {new Date(issue.resolvedAt).toLocaleDateString()}</span>}
              {issue.citizenConfirmed && <span className="px-2 py-0.5 bg-navy/10 text-navy rounded">Citizen Confirmed</span>}
              {issue.reopened && <span className="px-2 py-0.5 bg-red-50 text-danger rounded">Reopened</span>}
            </div>
          </div>

          {/* Reported Image */}
          {issue.image && (
            <div className="bg-white rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Reported Photo</h3>
              <img src={`/uploads/${issue.image}`} alt="Issue" className="rounded-lg border border-border max-h-80 object-cover w-full" />
            </div>
          )}

          {/* After image / Solution proof */}
          {(issue.afterImage || issue.solutionImage) && (
            <div className="bg-white rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Solution Proof (After Work)</h3>
              <img src={`/uploads/${issue.afterImage || issue.solutionImage}`} alt="Solution" className="rounded-lg border border-border max-h-80 object-cover w-full" />
              {issue.resolutionNote && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-gov mb-1">Resolution Note</p>
                  <p className="text-sm text-text-secondary">{issue.resolutionNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Citizen Confirm/Reopen section — only shown to reporter when status is solved */}
          {isCitizen && isReporter && issue.status === 'solved' && (
            <div className="bg-white rounded-xl border-2 border-green-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiCheckCircle size={18} className="text-green-gov" />
                <h3 className="font-bold text-green-gov">Issue Marked as Solved</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                The authority has marked this issue as solved. Please review the resolution proof above and confirm or reopen.
              </p>
              <div className="flex gap-3">
                <button onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-gov text-white font-semibold text-sm rounded-lg hover:bg-green-light transition-colors shadow-sm">
                  <FiCheckCircle size={16} /> Confirm Resolved
                </button>
                <button onClick={() => setReopenModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-danger text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                  <FiRotateCcw size={16} /> Reopen Issue
                </button>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {Array.isArray(issue.statusHistory) && issue.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <FiClock size={16} className="text-navy" /> Status Audit Trail
              </h3>
              <StatusTimeline statusHistory={issue.statusHistory} />
            </div>
          )}

          {/* Map */}
          {(issue.latitude && issue.longitude) && (
            <div className="bg-white rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Location</h3>
              <div className="map-wrap" style={{ height: 300 }}>
                <IssueMap issues={[{ ...issue, location: { coordinates: [issue.longitude, issue.latitude] } }]} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status actions — Authority gets modals instead of direct dropdown */}
          {isAuthority && availableTransitions.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-3">Update Status</h3>
              <p className="text-xs text-text-muted mb-3">Each transition requires structured data and proof.</p>
              <div className="flex flex-wrap gap-2">
                {availableTransitions.includes('in_progress') && (
                  <button onClick={() => setModalStatus('in_progress')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-saffron/30 text-saffron-dark hover:bg-saffron/10 transition-colors">
                    Start Work
                  </button>
                )}
                {availableTransitions.includes('solved') && (
                  <button onClick={() => setModalStatus('solved')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 text-green-gov hover:bg-green-50 transition-colors">
                    Mark Solved
                  </button>
                )}
                {availableTransitions.includes('escalated') && (
                  <button onClick={() => setModalStatus('escalated')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/30 text-purple hover:bg-purple/10 transition-colors">
                    Escalate
                  </button>
                )}
              </div>
              {canDelete && (
                <>
                  <hr className="my-4 border-border" />
                  <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs text-danger hover:underline">
                    <FiTrash2 size={12} />Delete Issue
                  </button>
                </>
              )}
            </div>
          )}

          {/* Admin / view-only info */}
          {user && user.role === 'admin' && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-2">Admin View</h3>
              <p className="text-xs text-text-muted">Admins can view but cannot interfere with the issue workflow.</p>
              {canDelete && (
                <>
                  <hr className="my-3 border-border" />
                  <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs text-danger hover:underline">
                    <FiTrash2 size={12} />Delete Issue
                  </button>
                </>
              )}
            </div>
          )}

          {/* Expected completion date */}
          {issue.expectedCompletionDate && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-2">Expected Completion</h3>
              <p className="text-sm">{new Date(issue.expectedCompletionDate).toLocaleDateString()}</p>
            </div>
          )}

          {/* Progress notes */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-sm mb-3">Progress Notes</h3>
            {isAuthority && (
              <div className="flex gap-2 mb-3">
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30" />
                <button onClick={handleNote} className="px-3 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark"><FiSend size={14}/></button>
              </div>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(!issue.progressNotes || issue.progressNotes.length === 0) ? (
                <p className="text-xs text-text-muted text-center py-4">No notes yet</p>
              ) : issue.progressNotes.map((n, i) => (
                <div key={i} className="bg-bg rounded-lg px-3 py-2 text-xs border border-border/50">
                  <p>{n.note || n}</p>
                  {n.addedBy && <p className="text-text-muted mt-0.5">by {n.addedBy.name || 'Authority'}</p>}
                  {n.createdAt && <p className="text-text-muted">{new Date(n.createdAt).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Assigned / Resolved info */}
          {issue.assignedTo && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-2">Assigned Authority</h3>
              <p className="text-sm">{issue.assignedTo.name || 'Authority'}</p>
              {issue.assignedTo.ward && <p className="text-xs text-text-muted">{issue.assignedTo.ward}</p>}
            </div>
          )}
          {issue.resolvedBy && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-sm mb-2">Resolved By</h3>
              <p className="text-sm">{issue.resolvedBy.name || 'Authority'}</p>
              {issue.resolvedAt && <p className="text-xs text-text-muted">on {new Date(issue.resolvedAt).toLocaleString()}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Status Transition Modal */}
      {modalStatus && (
        <StatusTransitionModal
          targetStatus={modalStatus}
          issueName={issue.title}
          onConfirm={handleStatusModalConfirm}
          onClose={() => setModalStatus(null)}
        />
      )}

      {/* Reopen Modal */}
      {reopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FiAlertTriangle size={20} className="text-danger" />
                <h2 className="font-bold text-navy text-lg">Reopen Issue</h2>
              </div>
              <button onClick={() => setReopenModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="text-lg">&times;</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-text-secondary">Please explain why this issue needs to be reopened:</p>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Describe what is still not resolved..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setReopenModal(false)} disabled={reopenSubmitting}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-gray-100 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleReopen} disabled={reopenSubmitting}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-danger text-white hover:bg-red-700 disabled:opacity-50">
                {reopenSubmitting ? 'Submitting...' : 'Reopen Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
