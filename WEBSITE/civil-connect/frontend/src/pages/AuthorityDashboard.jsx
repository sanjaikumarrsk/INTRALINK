import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getIssues, getIssue, updateIssueStatus, addProgressNote } from '../services/api';
import StatCard from '../components/StatCard';
import StatusTransitionModal from '../components/StatusTransitionModal';
import StatusTimeline from '../components/StatusTimeline';
import { toast } from 'react-toastify';
import { FiFileText, FiClock, FiCheckCircle, FiAlertTriangle, FiSend, FiExternalLink, FiLock } from 'react-icons/fi';

const SL = { pending: 'Pending', in_progress: 'In Progress', solved: 'Solved', escalated: 'Escalated', closed: 'Closed', reopened: 'Reopened' };
const SC = { pending: 'bg-red-50 text-danger', in_progress: 'bg-saffron/10 text-saffron-dark', solved: 'bg-green-50 text-green-gov', escalated: 'bg-purple/10 text-purple', closed: 'bg-navy/10 text-navy', reopened: 'bg-red-50 text-danger' };

// Valid transitions for authority
const VALID_TRANSITIONS = {
    pending: ['in_progress'],
    in_progress: ['solved', 'escalated'],
    escalated: ['in_progress'],  // only HIGHER_AUTHORITY
    solved: [],                  // citizen handles confirm/reopen
    closed: [],
    reopened: ['in_progress'],
};

export default function AuthorityDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [allIssues, setAllIssues] = useState([]);
    const [selected, setSelected] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [modalStatus, setModalStatus] = useState(null);
    const [live, setLive] = useState({ total: 0, pending: 0, inProgress: 0, solved: 0, escalated: 0, closed: 0, reopened: 0 });

    const fetchIssues = () => {
        getIssues().then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            setAllIssues(data);
            const filtered = data.filter(i => i.assignedTo || i.ward === user?.ward);
            setLive({
                total: filtered.length,
                pending: filtered.filter(i => i.status === 'pending').length,
                inProgress: filtered.filter(i => i.status === 'in_progress').length,
                solved: filtered.filter(i => i.status === 'solved').length,
                escalated: filtered.filter(i => i.status === 'escalated').length,
                closed: filtered.filter(i => i.status === 'closed').length,
                reopened: filtered.filter(i => i.status === 'reopened').length,
            });
        }).catch(() => {});
    };

    useEffect(() => { fetchIssues(); }, []);

    const issues = allIssues.filter(i => i.assignedTo || i.ward === user?.ward);

    // Determine available transitions based on user role
    const getTransitions = (issue) => {
        if (!issue) return [];
        const all = VALID_TRANSITIONS[issue.status] || [];
        // WARD_AUTHORITY cannot handle escalated issues
        if (user?.role === 'ward_authority' && issue.status === 'escalated') return [];
        return all;
    };

    const handleStatusModalConfirm = async (formData) => {
        try {
            await updateIssueStatus(selected._id, formData);
            toast.success('Status updated successfully');
            setModalStatus(null);
            fetchIssues();
            // Refresh selected issue
            const refreshed = await getIssue(selected._id);
            setSelected(refreshed.data);
        } catch (err) {
            throw err; // Let modal handle the error display
        }
    };

    const handleNote = async (id) => {
        if (!noteText.trim()) return;
        try {
            await addProgressNote(id, { note: noteText });
            toast.success('Note added');
            setNoteText('');
            fetchIssues();
        } catch (err) { toast.error('Failed to add note'); }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-navy">Ward Authority Dashboard</h1>
                <p className="text-sm text-text-secondary mt-1">Manage assigned issues with structured proof-based workflow.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard label="Assigned" value={live.total} icon={<FiFileText size={18} />} variant="navy" />
                <StatCard label="Pending" value={live.pending} icon={<FiClock size={18} />} variant="red" />
                <StatCard label="In Progress" value={live.inProgress} icon={<FiClock size={18} />} variant="saffron" />
                <StatCard label="Solved" value={live.solved} icon={<FiCheckCircle size={18} />} variant="green" />
                <StatCard label="Escalated" value={live.escalated} icon={<FiAlertTriangle size={18} />} variant="purple" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Issues list */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-border bg-gray-50">
                            <h2 className="font-semibold text-sm">Assigned Issues</h2>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                            {issues.length === 0 ? (
                                <p className="text-center py-12 text-text-muted text-sm">No assigned issues</p>
                            ) : issues.map(issue => (
                                <div key={issue._id}
                                    onClick={() => setSelected(selected?._id === issue._id ? null : issue)}
                                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${selected?._id === issue._id ? 'bg-blue-50 border-l-2 border-l-navy' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate">{issue.title}</p>
                                            <p className="text-xs text-text-muted mt-0.5">{issue.ward || 'Unknown'} · {new Date(issue.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ml-3 ${SC[issue.status]}`}>
                                            {SL[issue.status]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detail / Action panel */}
                <div>
                    {selected ? (
                        <div className="bg-white rounded-xl border border-border shadow-sm p-5 space-y-4 sticky top-4">
                            <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-navy flex-1">{selected.title}</h3>
                                <button
                                    onClick={() => navigate(`/issues/${selected._id}`)}
                                    className="text-navy hover:underline text-xs flex items-center gap-1 shrink-0 ml-2"
                                >
                                    <FiExternalLink size={12} /> Full View
                                </button>
                            </div>
                            <p className="text-sm text-text-secondary">{selected.description}</p>

                            {selected.image && (
                                <img src={`/uploads/${selected.image}`} alt="Issue" className="rounded-lg border border-border w-full max-h-48 object-cover" />
                            )}

                            {/* Current status */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-text-secondary">Current Status:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${SC[selected.status]}`}>
                                    {SL[selected.status]}
                                </span>
                            </div>

                            {/* Status actions — modal-based, not direct dropdown */}
                            {(() => {
                                const transitions = getTransitions(selected);
                                if (transitions.length === 0) {
                                    return (
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-border text-xs text-text-muted">
                                            <FiLock size={14} />
                                            {selected.status === 'solved' ? 'Waiting for citizen to confirm or reopen.' :
                                             selected.status === 'closed' ? 'This issue has been confirmed and closed.' :
                                             selected.status === 'escalated' && user?.role === 'ward_authority' ? 'Escalated to Higher Authority. You cannot manage this.' :
                                             'No actions available for this status.'}
                                        </div>
                                    );
                                }
                                return (
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1.5">Update Status</label>
                                        <p className="text-xs text-text-muted mb-2">Each transition requires mandatory notes and proof.</p>
                                        <div className="flex flex-wrap gap-2">
                                            {transitions.includes('in_progress') && (
                                                <button onClick={() => setModalStatus('in_progress')}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-saffron/30 text-saffron-dark hover:bg-saffron/10 transition-colors">
                                                    Start Work
                                                </button>
                                            )}
                                            {transitions.includes('solved') && (
                                                <button onClick={() => setModalStatus('solved')}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 text-green-gov hover:bg-green-50 transition-colors">
                                                    Mark Solved
                                                </button>
                                            )}
                                            {transitions.includes('escalated') && (
                                                <button onClick={() => setModalStatus('escalated')}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple/30 text-purple hover:bg-purple/10 transition-colors">
                                                    Escalate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Add note */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Add Progress Note</label>
                                <div className="flex gap-2">
                                    <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                                        placeholder="Type a progress update..."
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30" />
                                    <button onClick={() => handleNote(selected._id)}
                                        className="px-3 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors">
                                        <FiSend size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Status History Timeline (compact) */}
                            {selected.statusHistory?.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Status History</label>
                                    <div className="max-h-52 overflow-y-auto">
                                        <StatusTimeline statusHistory={selected.statusHistory} />
                                    </div>
                                </div>
                            )}

                            {/* Progress notes */}
                            {selected.progressNotes?.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Progress Notes</label>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {selected.progressNotes.map((n, i) => (
                                            <div key={i} className="text-xs bg-bg rounded-lg px-3 py-2 border border-border/50">
                                                <p>{n.note || n}</p>
                                                {n.createdAt && <p className="text-text-muted mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center text-text-muted text-sm">
                            Select an issue to view details and take action
                        </div>
                    )}
                </div>
            </div>

            {/* Status Transition Modal */}
            {modalStatus && selected && (
                <StatusTransitionModal
                    targetStatus={modalStatus}
                    issueName={selected.title}
                    onConfirm={handleStatusModalConfirm}
                    onClose={() => setModalStatus(null)}
                />
            )}
        </div>
    );
}
