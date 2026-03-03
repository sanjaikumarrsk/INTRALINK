import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue } from '../services/api';
import { toast } from 'react-toastify';
import { FiUpload, FiMapPin, FiSend } from 'react-icons/fi';

const CATEGORIES = ['garbage','road_damage','water_leakage','streetlight','drainage','tree_fallen','fire_hazard','flooding','pothole','broken_footpath','other'];
const CAT_LABELS = { garbage:'Garbage Complaint', road_damage:'Road Damage', water_leakage:'Water Leakage', streetlight:'Streetlight Not Working', drainage:'Drainage Blockage', tree_fallen:'Tree Fallen', fire_hazard:'Fire Hazard', flooding:'Flooding', pothole:'Pothole', broken_footpath:'Broken Footpath', other:'Other' };

export default function ReportIssue() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title:'', description:'', category:'road_damage', ward:'', latitude:'', longitude:'' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      if (form.ward) formData.append('ward', form.ward);
      if (form.latitude) formData.append('latitude', form.latitude);
      if (form.longitude) formData.append('longitude', form.longitude);
      if (image) formData.append('image', image);
      await createIssue(formData);
      toast.success('Issue reported successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to report issue. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Report an Issue</h1>
        <p className="text-sm text-text-secondary mt-1">Submit a civic complaint. Provide as much detail as possible.</p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm max-w-3xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Issue Title *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
              placeholder="e.g. Broken water pipe on Main Road" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description *</label>
            <textarea required rows={4} value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy resize-none"
              placeholder="Describe the issue in detail..." />
          </div>

          {/* Category + Ward */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Category *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Ward Number</label>
              <select value={form.ward} onChange={e => setForm({...form, ward: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy">
                <option value="">Auto-detect / Select</option>
                {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={`Ward ${i+1}`}>Ward {i+1}</option>)}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              <FiMapPin className="inline mr-1" size={14}/>Location
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" value={form.latitude} readOnly placeholder="Latitude"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-gray-50 text-sm text-text-secondary" />
              <input type="text" value={form.longitude} readOnly placeholder="Longitude"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-gray-50 text-sm text-text-secondary" />
            </div>
            <button type="button" onClick={detectLocation} disabled={locating}
              className="mt-2 text-xs text-navy hover:underline flex items-center gap-1">
              <FiMapPin size={12}/>{locating ? 'Detecting...' : 'Re-detect my location'}
            </button>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              <FiUpload className="inline mr-1" size={14}/>Upload Photo
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-navy/40 transition-colors">
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="img-upload" />
              <label htmlFor="img-upload" className="cursor-pointer">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                ) : (
                  <div className="py-6">
                    <FiUpload className="mx-auto text-text-muted mb-2" size={28}/>
                    <p className="text-sm text-text-secondary">Click to upload an image</p>
                    <p className="text-xs text-text-muted mt-1">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-navy text-white font-semibold rounded-lg hover:bg-navy-dark transition-colors disabled:opacity-60 text-sm">
              <FiSend size={16}/>{loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
