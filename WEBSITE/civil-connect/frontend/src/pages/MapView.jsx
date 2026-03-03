import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { getZones, createZone as apiCreateZone, getIssues } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiMapPin, FiPlus, FiX } from 'react-icons/fi';

/* ── Severity color map for zone overlays ── */
const SEVERITY_COLORS = {
  GREEN:  { color: '#138808', fill: '#138808', label: 'Safe' },
  YELLOW: { color: '#EAB308', fill: '#EAB308', label: 'Warning' },
  ORANGE: { color: '#FF9933', fill: '#FF9933', label: 'High Risk' },
  RED:    { color: '#DC2626', fill: '#DC2626', label: 'Critical' },
};

/* ── Issue status → marker color ── */
const STATUS_MARKER = {
  pending:     '#DC2626',
  in_progress: '#FF9933',
  solved:      '#138808',
  escalated:   '#7C3AED',
};

/* Custom colored circle marker icon */
function makeIcon(color, size = 12) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}


const DISASTER_TYPES = [
  'Flood', 'Earthquake', 'Fire', 'Cyclone',
  'Landslide', 'Heatwave', 'Gas Leak', 'Building Collapse', 'Other',
];

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
  'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  'All',
];

/* ── Default city center (India) ── */
const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore
const DEFAULT_ZOOM = 12;

/* ── Click handler to pick coordinates ── */
function MapClickHandler({ onMapClick, active }) {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

/* ── Auto-fit bounds when zones change ── */
function FitBounds({ zones }) {
  const map = useMap();
  useEffect(() => {
    if (!zones.length) return;
    const points = zones.map(z => [z.lat, z.lng]);
    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    }
  }, [zones, map]);
  return null;
}

export default function MapView() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [zones, setZones] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssues, setShowIssues] = useState(true);
  const [showZones, setShowZones] = useState(true);

  /* Form state for zone marking */
  const [showForm, setShowForm] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [form, setForm] = useState({
    severity: 'RED',
    disasterType: 'Flood',
    areaName: '',
    ward: user?.ward || 'Ward 1',
    lat: '',
    lng: '',
    radius: 800,
  });

  const isAuthority = user && ['admin', 'higher_authority', 'ward_authority'].includes(user.role);

  /* Fetch zones from DB */
  const fetchZones = useCallback(() => {
    getZones()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setZones(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Fetch issues (all) */
  const fetchIssues = useCallback(() => {
    getIssues()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setIssues(data.filter(i => i.latitude && i.longitude));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchZones(); fetchIssues(); }, [fetchZones, fetchIssues]);

  /* Real-time: listen for zone updates via socket */
  useEffect(() => {
    if (!socket) return;

    const handleZoneUpdate = (data) => {
      setZones(prev => {
        const idx = prev.findIndex(z => z._id === data._id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...data };
          return updated;
        }
        return [data, ...prev];
      });

      if (data.severity === 'RED') {
        toast.error(`CRITICAL: ${data.disasterType || 'Disaster'} at ${data.areaName}`, { autoClose: 8000 });
      } else if (data.severity === 'ORANGE') {
        toast.warning(`HIGH RISK: ${data.disasterType || 'Alert'} at ${data.areaName}`, { autoClose: 5000 });
      }
    };

    const handleZoneRemoved = (data) => {
      setZones(prev => prev.filter(z => z._id !== data._id));
    };

    socket.on('zoneUpdate', handleZoneUpdate);
    socket.on('zoneRemoved', handleZoneRemoved);

    /* Listen for new issues */
    const handleNewIssue = (data) => {
      if (data.latitude && data.longitude) {
        setIssues(prev => [data, ...prev]);
      }
    };
    socket.on('newIssue', handleNewIssue);
    socket.on('newReport', handleNewIssue);

    return () => {
      socket.off('zoneUpdate', handleZoneUpdate);
      socket.off('zoneRemoved', handleZoneRemoved);
      socket.off('newIssue', handleNewIssue);
      socket.off('newReport', handleNewIssue);
    };
  }, [socket]);

  /* Handle map click to pick coordinates */
  const handleMapClick = (latlng) => {
    setForm(prev => ({ ...prev, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) }));
    setPickingLocation(false);
    toast.info(`Location selected: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
  };

  /* Submit zone */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.areaName || !form.lat || !form.lng) {
      toast.error('Please fill area name and select location on map');
      return;
    }

    try {
      await apiCreateZone({
        ward: form.ward,
        severity: form.severity,
        disasterType: form.disasterType,
        areaName: form.areaName,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        radius: parseInt(form.radius) || 800,
      });

      toast.success(`${form.severity} zone marked at ${form.areaName}`);
      setForm({ severity: 'RED', disasterType: 'Flood', areaName: '', ward: user?.ward || 'Ward 1', lat: '', lng: '', radius: 800 });
      setShowForm(false);
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create zone');
    }
  };

  const dangerCount = zones.filter(z => z.severity === 'RED').length;
  const warningCount = zones.filter(z => z.severity === 'ORANGE').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Interactive Map</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time zone monitoring across all wards
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthority && (
            <button
              onClick={() => { setShowForm(!showForm); setPickingLocation(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger text-white hover:bg-red-700 transition-colors"
            >
              {showForm ? <FiX size={14} /> : <FiPlus size={14} />}
              {showForm ? 'Close' : 'Mark Zone'}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="live-dot"></div>
            <span className="text-xs font-medium text-green-gov">LIVE</span>
          </div>
        </div>
      </div>

      {/* Active alert banner */}
      {dangerCount > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <FiAlertTriangle className="text-danger shrink-0" size={18} />
          <p className="text-sm font-semibold text-danger">
            CRITICAL: {dangerCount} Red Zone{dangerCount !== 1 ? 's' : ''} active
            {warningCount > 0 && ` · ${warningCount} Orange zone${warningCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {/* Zone marking form (authorities only) */}
      {showForm && isAuthority && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-sm text-navy mb-3 flex items-center gap-2">
            <FiAlertTriangle size={16} /> Mark Danger Zone
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Severity Level</label>
                <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                  <option value="GREEN">GREEN — Safe</option>
                  <option value="YELLOW">YELLOW — Warning</option>
                  <option value="ORANGE">ORANGE — High Risk</option>
                  <option value="RED">RED — Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Disaster Type</label>
                <select value={form.disasterType} onChange={e => setForm({ ...form, disasterType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                  {DISASTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Ward</label>
                <select value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Area Name</label>
                <input type="text" value={form.areaName} onChange={e => setForm({ ...form, areaName: e.target.value })}
                  placeholder="e.g. Sector 14"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Latitude</label>
                <input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })}
                  placeholder="Click map or type"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Longitude</label>
                <input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })}
                  placeholder="Click map or type"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Radius (m)</label>
                <input type="number" value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPickingLocation(!pickingLocation)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  pickingLocation ? 'bg-saffron text-navy' : 'bg-navy/10 text-navy hover:bg-navy/20'
                }`}>
                <FiMapPin size={14} />
                {pickingLocation ? 'Click on map to pick…' : 'Pick Location on Map'}
              </button>
              <button type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-navy text-white hover:bg-navy-dark transition-colors">
                <FiPlus size={14} /> Create Zone
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Legend with toggle controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button onClick={() => setShowZones(!showZones)} className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${showZones ? 'bg-navy/10 border-navy/30 text-navy' : 'border-border text-text-muted'}`}>
          Zones
        </button>
        {Object.entries(SEVERITY_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: val.color }} />
            <span className="text-xs font-medium text-text-secondary">{key} — {val.label}</span>
          </div>
        ))}
        <span className="text-border">|</span>
        <button onClick={() => setShowIssues(!showIssues)} className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${showIssues ? 'bg-navy/10 border-navy/30 text-navy' : 'border-border text-text-muted'}`}>
          Issues ({issues.length})
        </button>
        {Object.entries(STATUS_MARKER).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-text-secondary capitalize">{k.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="map-wrap" style={{ height: 'calc(100vh - 340px)', minHeight: '450px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy"></div>
              <p className="text-sm text-text-muted">Loading map…</p>
            </div>
          </div>
        ) : (
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <MapClickHandler onMapClick={handleMapClick} active={pickingLocation} />
            {zones.length > 0 && <FitBounds zones={zones} />}

            {/* Zone overlays */}
            {showZones && zones.map(z => {
              const sev = SEVERITY_COLORS[z.severity] || SEVERITY_COLORS.YELLOW;
              return (
                <Circle
                  key={z._id}
                  center={[z.lat, z.lng]}
                  radius={z.radius || 800}
                  pathOptions={{
                    color: sev.color,
                    fillColor: sev.fill,
                    fillOpacity: z.severity === 'RED' ? 0.3 : z.severity === 'ORANGE' ? 0.22 : 0.15,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: sev.color }} />
                        <strong style={{ color: sev.color, fontSize: 13 }}>
                          {z.severity} — {sev.label}
                        </strong>
                      </div>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                        <b>Area:</b> {z.areaName}<br/>
                        <b>Ward:</b> {z.ward}<br/>
                        <b>Disaster:</b> {z.disasterType || 'N/A'}<br/>
                        <b>Radius:</b> {z.radius || 800}m<br/>
                        <b>Updated:</b> {z.updatedAt ? new Date(z.updatedAt).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* Issue markers (color-coded by status) */}
            {showIssues && issues.map(i => (
              <Marker key={i._id} position={[i.latitude, i.longitude]} icon={makeIcon(STATUS_MARKER[i.status] || '#6B7280')}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong style={{ fontSize: 13 }}>{i.title}</strong>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginTop: 4 }}>
                      <b>Category:</b> {(i.category || '').replace(/_/g, ' ')}<br/>
                      <b>Status:</b> <span style={{ color: STATUS_MARKER[i.status], fontWeight: 600 }}>{(i.status || '').replace('_', ' ')}</span><br/>
                      <b>Ward:</b> {i.ward || '—'}<br/>
                      <b>Date:</b> {new Date(i.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>
        )}
      </div>

      {/* Active zones table */}
      {zones.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50">
            <h3 className="font-semibold text-sm">Active Zones ({zones.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-left text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Ward</th>
                  <th className="px-4 py-3">Disaster</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => {
                  const sev = SEVERITY_COLORS[z.severity] || SEVERITY_COLORS.YELLOW;
                  return (
                    <tr key={z._id} className="border-t border-border/50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: sev.color }} />
                          <span className="font-semibold text-xs" style={{ color: sev.color }}>
                            {z.severity}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{z.areaName}</td>
                      <td className="px-4 py-3">{z.ward}</td>
                      <td className="px-4 py-3">{z.disasterType || '—'}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {z.updatedAt ? new Date(z.updatedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
