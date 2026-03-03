import { useState, useRef } from 'react';
import { FiX, FiUpload, FiAlertTriangle, FiCheckCircle, FiLoader, FiArrowUp } from 'react-icons/fi';

const STATUS_CONFIG = {
  in_progress: {
    title: 'Start Work on Issue',
    icon: <FiLoader size={20} className="text-saffron-dark" />,
    color: 'border-saffron/50 bg-saffron/5',
    btnColor: 'bg-saffron-dark hover:bg-saffron text-white',
    noteLabel: 'Work Start Note *',
    notePlaceholder: 'Describe what work is being started, team assigned, etc.',
    noteRequired: true,
    imageLabel: 'Progress Photo (optional)',
    imageRequired: false,
    showExpectedDate: true,
  },
  escalated: {
    title: 'Escalate Issue',
    icon: <FiArrowUp size={20} className="text-purple" />,
    color: 'border-purple/50 bg-purple/5',
    btnColor: 'bg-purple hover:bg-purple/80 text-white',
    noteLabel: 'Escalation Reason *',
    notePlaceholder: 'Explain why this issue needs escalation to higher authority...',
    noteRequired: true,
    imageLabel: null,
    imageRequired: false,
    showTargetRole: true,
  },
  solved: {
    title: 'Mark Issue as Solved',
    icon: <FiCheckCircle size={20} className="text-green-gov" />,
    color: 'border-green-200 bg-green-50',
    btnColor: 'bg-green-gov hover:bg-green-light text-white',
    noteLabel: 'Resolution Note *',
    notePlaceholder: 'Describe the resolution: what work was done, materials used, etc.',
    noteRequired: true,
    imageLabel: 'After-Work Proof Image *',
    imageRequired: true,
  },
};

export default function StatusTransitionModal({ targetStatus, issueName, onConfirm, onClose }) {
  const config = STATUS_CONFIG[targetStatus];
  if (!config) return null;

  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expectedDate, setExpectedDate] = useState('');
  const [targetRole, setTargetRole] = useState('HIGHER_AUTHORITY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError('');
    // Validate required fields
    if (config.noteRequired && !note.trim()) {
      setError(`${config.noteLabel.replace(' *', '')} is required`);
      return;
    }
    if (config.imageRequired && !image) {
      setError(`${config.imageLabel.replace(' *', '')} is required`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', targetStatus);
      formData.append('note', note.trim());
      if (image) formData.append('proofImage', image);
      if (expectedDate) formData.append('expectedCompletionDate', expectedDate);
      if (config.showTargetRole) formData.append('escalatedTo', targetRole);

      await onConfirm(formData);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update status');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl border-2 ${config.color} shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <h2 className="font-bold text-navy text-lg">{config.title}</h2>
              <p className="text-xs text-text-muted truncate max-w-[280px]">{issueName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">
              <FiAlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Note field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{config.noteLabel}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={config.notePlaceholder}
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
            />
          </div>

          {/* Image upload */}
          {config.imageLabel && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{config.imageLabel}</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-navy/40 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="rounded-lg max-h-40 mx-auto object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    <FiUpload size={24} />
                    <p className="text-sm">Click to upload image</p>
                    <p className="text-xs">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {image && (
                <p className="text-xs text-text-muted mt-1">{image.name} ({(image.size / 1024).toFixed(1)} KB)</p>
              )}
            </div>
          )}

          {/* Expected completion date (for in_progress) */}
          {config.showExpectedDate && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Expected Completion Date (optional)</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>
          )}

          {/* Target role (for escalation) */}
          {config.showTargetRole && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Escalate To</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                <option value="HIGHER_AUTHORITY">Higher Authority</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-gray-50/50 rounded-b-2xl">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-gray-100 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${config.btnColor}`}>
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
