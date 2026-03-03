import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getIssues } from '../services/api';
import IssueMap from '../components/IssueMap';
import StatCard from '../components/StatCard';
import { FiFileText, FiClock, FiLoader, FiCheckCircle, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ZONE_OPTIONS = [
    { type: 'red', label: 'Red Zone (Critical Risk)', color: '#DC2626' },
    { type: 'orange', label: 'Orange Zone (High Risk)', color: '#FF9933' },
    { type: 'yellow', label: 'Yellow Zone (Moderate Risk)', color: '#EAB308' },
];

export default function ControlRoom() {
  const { user } = useAuth();
  const { zones, addZone } = useNotifications();
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    getIssues().then(res => setIssues(res.data)).catch(() => {});
  }, []);

  const [zoneForm, setZoneForm] = useState({ type: 'red', areaName: '', lat: '', lng: '', radius: 800 });
  const [showZonePanel, setShowZonePanel] = useState(false);

  const total = issues.length;
  const pending = issues.filter(i => i.status === 'pending').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const solved = issues.filter(i => i.status === 'solved').length;
  const escalated = issues.filter(i => i.status === 'escalated').length;

  const canMarkZone = user && ['admin', 'higher_authority'].includes(user.role);

  const handleAddZone = (e) => {
      e.preventDefault();
      if (!zoneForm.areaName || !zoneForm.lat || !zoneForm.lng) {
          toast.error('Please fill in area name and coordinates');
          return;
      }
      addZone({
          type: zoneForm.type,
          areaName: zoneForm.areaName,
          lat: parseFloat(zoneForm.lat),
          lng: parseFloat(zoneForm.lng),
          radius: parseInt(zoneForm.radius) || 800,
      });
      const label = ZONE_OPTIONS.find(z => z.type === zoneForm.type)?.label || zoneForm.type;
      toast.success(`${label} marked at ${zoneForm.areaName}`);
      setZoneForm({ type: 'red', areaName: '', lat: '', lng: '', radius: 800 });
      setShowZonePanel(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Live Monitoring Control Room</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time overview of all civic issues across wards</p>
        </div>
        <div className="flex items-center gap-3">
          {canMarkZone && (
            <button onClick={() => setShowZonePanel(!showZonePanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger text-white hover:bg-red-700 transition-colors">
              <FiAlertOctagon size={14} /> Mark Zone
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="live-dot"></div>
            <span className="text-xs font-medium text-green-gov">LIVE</span>
          </div>
        </div>
      </div>

      {/* Zone marking panel */}
      {showZonePanel && canMarkZone && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-sm text-navy mb-3 flex items-center gap-2">
            <FiAlertOctagon size={16} /> Mark Alert Zone
          </h3>
          <form onSubmit={handleAddZone} className="grid md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Zone Type</label>
              <select value={zoneForm.type} onChange={e => setZoneForm({ ...zoneForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                {ZONE_OPTIONS.map(z => <option key={z.type} value={z.type}>{z.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Area Name</label>
              <input type="text" value={zoneForm.areaName} onChange={e => setZoneForm({ ...zoneForm, areaName: e.target.value })}
                placeholder="e.g. Sector 14"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Latitude</label>
              <input type="number" step="any" value={zoneForm.lat} onChange={e => setZoneForm({ ...zoneForm, lat: e.target.value })}
                placeholder="12.9716"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Longitude</label>
              <input type="number" step="any" value={zoneForm.lng} onChange={e => setZoneForm({ ...zoneForm, lng: e.target.value })}
                placeholder="77.5946"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <button type="submit"
              className="px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-dark transition-colors">
              Add Zone
            </button>
          </form>
        </div>
      )}

      {/* Active zone banner */}
      {zones.filter(z => z.type === 'red').length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <FiAlertOctagon className="text-danger shrink-0" size={18} />
          <p className="text-sm font-semibold text-danger">
            CRITICAL: {zones.filter(z => z.type === 'red').length} Red Zone(s) active —{' '}
            {zones.filter(z => z.type === 'red').map(z => z.areaName).join(', ')}
          </p>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={total} icon={<FiFileText size={18}/>} color="navy" />
        <StatCard label="Pending" value={pending} icon={<FiClock size={18}/>} color="red" />
        <StatCard label="In Progress" value={inProgress} icon={<FiLoader size={18}/>} color="saffron" />
        <StatCard label="Solved" value={solved} icon={<FiCheckCircle size={18}/>} color="green" />
        <StatCard label="Escalated" value={escalated} icon={<FiAlertTriangle size={18}/>} color="purple" />
      </div>

      {/* Map */}
      <div className="map-wrap h-full">
        <IssueMap issues={issues} zones={zones} />
      </div>

      {/* Escalation Alerts */}
      {escalated > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle className="text-danger" size={18}/>
            <h3 className="font-semibold text-danger">Escalation Alerts</h3>
          </div>
          <div className="space-y-2">
            {issues.filter(i => i.status === 'escalated').slice(0, 5).map(i => (
              <div key={i._id} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2 border border-red-100">
                <span className="font-medium truncate max-w-[60%]">{i.title}</span>
                <span className="text-text-muted">Ward {i.ward || '\u2014'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active zones list */}
      {zones.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50">
            <h3 className="font-semibold text-sm">Active Alert Zones ({zones.length})</h3>
          </div>
          <div className="divide-y divide-border/50">
            {zones.map(z => (
              <div key={z._id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${z.type === 'red' ? 'bg-danger' : z.type === 'orange' ? 'bg-saffron' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{z.areaName}</p>
                  <p className="text-xs text-text-muted">
                    {z.type === 'red' ? 'Critical Risk' : z.type === 'orange' ? 'High Risk' : 'Moderate Risk'} · {new Date(z.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
