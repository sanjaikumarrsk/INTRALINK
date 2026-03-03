import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

const createIcon = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40] });
};

const STATUS_COLOR = { pending: '#DC2626', in_progress: '#FF9933', solved: '#138808', escalated: '#7C3AED' };
const STATUS_LABEL = { pending: 'Pending', in_progress: 'In Progress', solved: 'Solved', escalated: 'Escalated' };
const CAT_LABEL = { road_damage: 'Road Damage', streetlight: 'Streetlight', garbage: 'Garbage', transport: 'Transport', other: 'Other' };

const ZONE_COLORS = { red: '#DC2626', orange: '#FF9933', yellow: '#EAB308' };
const ZONE_LABELS = { red: 'Red Zone (Critical Risk)', orange: 'Orange Zone (High Risk)', yellow: 'Yellow Zone (Moderate Risk)' };

function FitBounds({ issues, zones }) {
  const map = useMap();
  useEffect(() => {
    const points = issues.map(i => [i.latitude, i.longitude]);
    if (zones?.length) zones.forEach(z => points.push([z.lat, z.lng]));
    if (!points.length) return;
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [issues, zones, map]);
  return null;
}

export default function IssueMap({ issues, zones = [], fullscreen = false, onMarkerClick }) {
  const center = issues.length ? [issues[0].latitude, issues[0].longitude] : [20.5937, 78.9629];
  return (
    <div className={`map-wrap ${fullscreen ? 'h-full' : ''}`} style={fullscreen ? {} : { height: 400 }}>
      <MapContainer center={center} zoom={5} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <FitBounds issues={issues} zones={zones} />

        {/* Zone overlays */}
        {zones.map(z => (
          <Circle key={z._id} center={[z.lat, z.lng]} radius={z.radius || 800}
            pathOptions={{ color: ZONE_COLORS[z.type] || '#DC2626', fillColor: ZONE_COLORS[z.type] || '#DC2626', fillOpacity: 0.18, weight: 2 }}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ color: ZONE_COLORS[z.type] }}>{ZONE_LABELS[z.type]}</strong><br/>
                <span style={{ fontSize: 12, color: '#64748B' }}>Area: {z.areaName}</span><br/>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(z.createdAt).toLocaleString()}</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Issue markers */}
        {issues.map(issue => (
          <Marker key={issue._id} position={[issue.latitude, issue.longitude]}
            icon={createIcon(STATUS_COLOR[issue.status] || '#0B3D91')}
            eventHandlers={{ click: () => onMarkerClick?.(issue) }}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{issue.title}</strong><br/>
                <span style={{ fontSize: 12, color: '#64748B' }}>{CAT_LABEL[issue.category] || issue.category}</span><br/>
                <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: STATUS_COLOR[issue.status]+'20', color: STATUS_COLOR[issue.status] }}>
                  {STATUS_LABEL[issue.status]}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
