import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MapUI from './MapUI';

const getRelativeTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return '';
  const now = new Date();
  const incidentTime = new Date(timestamp.seconds * 1000);
  const diffInSeconds = Math.floor((now - incidentTime) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
};

// --- LOGIC MAP: Chỉ bay khi tọa độ HỢP LỆ ---
function MapLogic({ coords, region }) {
  const map = useMap();

  useEffect(() => {
    // 🔥 SỬA LỖI: Kiểm tra chặt chẽ xem coords có phải là số không
    if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      try {
        const targetZoom = 16;
        const targetPoint = map.project(coords, targetZoom);
        const newTargetPoint = targetPoint.subtract([0, 200]);
        const newCenter = map.unproject(newTargetPoint, targetZoom);

        map.flyTo(newCenter, targetZoom, { duration: 1.5 });
      } catch (e) {
        console.warn("Lỗi khi di chuyển map:", e);
      }
    }
  }, [coords, map]);

  useEffect(() => {
    // Nếu không chọn bài nào (coords = null) thì về region
    if (!coords && region) {
      map.flyTo(region.center, region.zoom, { duration: 1.5 });
    }
  }, [region, map, coords]);

  return null;
}

function MapEvents({ setMapInstance, onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => { onZoomChange(map.getZoom()); },
    moveend: () => { onZoomChange(map.getZoom()); }
  });
  useEffect(() => {
    setMapInstance(map);
    onZoomChange(map.getZoom());
  }, [map, setMapInstance, onZoomChange]);
  return null;
}

const IncidentMarker = ({ incident, isSelected, createCustomIcon, onMarkerClick, getIconClass, getTypeName }) => {
    const markerRef = useRef(null);

    useEffect(() => {
        if (isSelected && markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [isSelected]);

    // 🔥 AN TOÀN: Nếu không có lat/lng thì không render Marker này
    if (!incident.lat || !incident.lng) return null;

    return (
        <Marker
            ref={markerRef}
            position={[incident.lat, incident.lng]}
            icon={createCustomIcon(incident.type)}
            eventHandlers={{ click: () => onMarkerClick(incident) }}
        >
            <Popup className="custom-popup" maxWidth={320} autoPan={false}>
                <div className="popup-container">
                  <div className="popup-header-section">
                    <h3 className="popup-title">{incident.title}</h3>
                    <div className="popup-address">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{incident.location || "Chưa xác định"}</span>
                    </div>
                    <div className="popup-google-map">
                      <a href={`http://googleusercontent.com/maps.google.com/?q=${incident.lat},${incident.lng}`} target="_blank" rel="noopener noreferrer">
                        Xem trên Google Maps <i className="fas fa-external-link-alt"></i>
                      </a>
                    </div>
                  </div>

                  <div className="popup-body-section">
                    <div className="popup-meta">
                      <span className={`popup-badge status-${incident.type || 'news'}`}>
                        <i className={`fas ${getIconClass(incident.type)}`}></i> {getTypeName(incident.type)}
                      </span>
                      <span className="popup-time-ago">{getRelativeTime(incident.time)}</span>
                    </div>
                    <div className="popup-description">{incident.description}</div>

                    {incident.image && incident.image.startsWith('http') && (
                        <div style={{width: '100%', borderRadius: '8px', marginTop: '10px', maxHeight: '150px', overflow:'hidden'}}>
                             <img src={incident.image} alt="Ảnh" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
                             onError={(e) => { e.target.style.display = 'none'; if(e.target.parentElement) e.target.parentElement.style.display = 'none'; }} />
                        </div>
                    )}

                    {incident.sourceLink && (
                      <div className="popup-source" style={{marginTop: '10px'}}>
                        <strong>Nguồn: </strong>
                        <a href={incident.sourceLink} target="_blank" rel="noopener noreferrer">Link bài viết <i className="fas fa-link"></i></a>
                      </div>
                    )}
                  </div>
                </div>
            </Popup>
        </Marker>
    );
};

function MapWrapper({ incidents, region, currentFilter, onFilterChange, incidentCounts, selectedIncident, timeFilter, onOpenFilterModal, onMarkerClick }) {
  const mapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapAttr = '© OpenStreetMap contributors';
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(region.zoom);
  const MARKER_VISIBLE_THRESHOLD = 8;
  const maxBounds = [[-5, 90], [30, 125]];

  const getIconClass = (type) => {
    switch (type) { case 'rescue': return 'fa-ambulance'; case 'help': return 'fa-hands-helping'; case 'warning': return 'fa-exclamation-triangle'; default: return 'fa-newspaper'; }
  };
  const getTypeName = (type) => {
    if(type === 'rescue') return 'Cần cứu hộ'; if(type === 'help') return 'Đội cứu hộ'; if(type === 'warning') return 'Cảnh báo'; return 'Tin tức';
  }
  const createCustomIcon = (type) => {
    let colorClass = 'marker-default';
    if (type === 'rescue') colorClass = 'marker-rescue'; if (type === 'help') colorClass = 'marker-help'; if (type === 'warning') colorClass = 'marker-warning'; if (type === 'news') colorClass = 'marker-news';
    const isPulse = type === 'rescue' ? '<div class="pulse-ring"></div>' : '';
    const iconClass = getIconClass(type);
    return L.divIcon({
      className: `custom-marker-container ${type}`,
      html: `<div class="marker-pin ${colorClass}"><i class="fas ${iconClass}"></i></div>${isPulse}`,
      iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40]
    });
  };

  // 🔥 SỬA LỖI LOGIC: Kiểm tra null/undefined thật kỹ
  let selectedCoords = null;
  if (selectedIncident &&
      selectedIncident.lat !== undefined && selectedIncident.lat !== null &&
      selectedIncident.lng !== undefined && selectedIncident.lng !== null) {
      selectedCoords = [selectedIncident.lat, selectedIncident.lng];
  }

  return (
    <MapContainer center={region.center} zoom={region.zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }} zoomControl={false} minZoom={5} maxBounds={maxBounds} maxBoundsViscosity={1.0}>
      <TileLayer attribution={mapAttr} url={mapUrl} />

      <MapLogic coords={selectedCoords} region={region} />
      <MapEvents setMapInstance={setMapInstance} onZoomChange={setCurrentZoom} />

      <MapUI currentFilter={currentFilter} onFilterChange={onFilterChange} counts={incidentCounts} map={mapInstance} timeFilter={timeFilter} onOpenFilterModal={onOpenFilterModal} />

      {currentZoom >= MARKER_VISIBLE_THRESHOLD && Array.isArray(incidents) && incidents.map(incident => {
         // Chặn marker lỗi ngay từ vòng lặp
         if (!incident.lat || !incident.lng) return null;
         return (
          <IncidentMarker key={incident.id} incident={incident} isSelected={selectedIncident && selectedIncident.id === incident.id} createCustomIcon={createCustomIcon} onMarkerClick={onMarkerClick} getIconClass={getIconClass} getTypeName={getTypeName} />
        );
      })}
    </MapContainer>
  );
}

export default MapWrapper;