import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MapUI from './MapUI';
import { REGIONS } from '../../constants/regionData';
// Import component vẽ đường
import RoutingMachine from './RoutingMachine';

const getRelativeTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return '';
  const now = new Date();
  const incidentTime = new Date(timestamp.seconds * 1000);
  const diffInMinutes = Math.floor((now - incidentTime) / 60000);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  return `${Math.floor(diffInHours / 24)} ngày trước`;
};

const isRegionLocation = (locationName) => {
    if (!locationName) return false;
    const cleanLoc = locationName.toLowerCase().trim();
    return REGIONS.some(r => r.name.toLowerCase() === cleanLoc || cleanLoc.includes(r.name.toLowerCase()));
};

// --- LOGIC MAP ---
function MapLogic({ coords, zoomLevel, region, moveTrigger }) {
  const map = useMap();
  const lat = coords ? coords[0] : null;
  const lng = coords ? coords[1] : null;
  const regionKey = region ? region.key : null;

  useEffect(() => {
    if (lat !== null && lng !== null) {
      try {
        const targetZoom = zoomLevel || 16;
        const targetPoint = map.project([lat, lng], targetZoom);
        // Bay lệch để né Header
        const flyToPoint = L.point(targetPoint.x - 100, targetPoint.y - 180);
        const flyToLatLng = map.unproject(flyToPoint, targetZoom);
        map.flyTo(flyToLatLng, targetZoom, { duration: 1.2 });
      } catch (e) {
        console.warn("Lỗi di chuyển map:", e);
      }
    } else if (region) {
      map.flyTo(region.center, region.zoom, { duration: 1.5 });
    }
  }, [lat, lng, zoomLevel, regionKey, map, moveTrigger]);

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

// --- MARKER & POPUP ---
const IncidentMarker = ({ incident, isSelected, createCustomIcon, onMarkerClick, getIconClass, getTypeName, onDirectClick }) => {
    const markerRef = useRef(null);
    useEffect(() => {
        if (isSelected && markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [isSelected]);

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
                      <span>{incident.location} {incident.isGeneral ? "(Khu vực chung)" : ""}</span>
                    </div>
                    {/* 🔥 ĐÃ XÓA LINK GOOGLE MAPS CŨ Ở ĐÂY 🔥 */}
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
                             <img src={incident.image} alt="Ảnh" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    )}

                    {/* 🔥 NÚT CHỈ ĐƯỜNG NỘI BỘ MỚI (MÀU XANH) 🔥 */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDirectClick(incident); // Gọi hàm vẽ đường
                        }}
                        style={{
                            marginTop: '15px', width: '100%', padding: '12px',
                            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        <i className="fas fa-directions"></i>
                        Chỉ đường tới đây
                    </button>

                    {incident.sourceLink && (
                      <div className="popup-source" style={{marginTop: '10px', textAlign: 'center'}}>
                        <a href={incident.sourceLink} target="_blank" rel="noopener noreferrer" style={{color: '#64748b', fontSize: '11px', textDecoration: 'none'}}>
                            Nguồn tin gốc <i className="fas fa-external-link-alt"></i>
                        </a>
                      </div>
                    )}
                  </div>
               </div>
            </Popup>
        </Marker>
    );
};

// --- MAIN COMPONENT ---
function MapWrapper({
    incidents, region, currentFilter, onFilterChange, incidentCounts,
    selectedIncident, timeFilter, onOpenFilterModal, onMarkerClick,
    moveTrigger
}) {
  const mapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapAttr = '© OpenStreetMap contributors';
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(region.zoom);
  const maxBounds = [[-20, 80], [40, 140]];

  // State cho chỉ đường
  const [routingDest, setRoutingDest] = useState(null);
  const [userPos, setUserPos] = useState(null);

  // Icon Logic
  const getIconClass = (type) => { switch (type) { case 'rescue': return 'fa-ambulance'; case 'supply': return 'fa-box-open'; case 'help': return 'fa-hands-helping'; case 'warning': return 'fa-exclamation-triangle'; default: return 'fa-newspaper'; } };
  const getTypeName = (type) => { if(type === 'rescue') return 'Cần cứu hộ'; if(type === 'supply') return 'Nhu yếu phẩm'; if(type === 'help') return 'Đội cứu hộ'; if(type === 'warning') return 'Cảnh báo'; return 'Tin tức'; }
  const createCustomIcon = (type) => {
    let colorClass = 'marker-news';
    if (type === 'rescue') colorClass = 'marker-rescue';
    if (type === 'help') colorClass = 'marker-help';
    if (type === 'warning') colorClass = 'marker-warning';
    if (type === 'supply') colorClass = 'marker-supply';
    const isPulse = type === 'rescue' ? '<div class="pulse-ring"></div>' : '';
    const iconClass = getIconClass(type);
    return L.divIcon({ className: `custom-marker-container ${type}`, html: `<div class="marker-pin ${colorClass}"><i class="fas ${iconClass}"></i></div>${isPulse}`, iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
  };

  let selectedCoords = null;
  let selectedZoom = 16;
  if (selectedIncident && selectedIncident.lat && selectedIncident.lng) {
      selectedCoords = [selectedIncident.lat, selectedIncident.lng];
      const isGeneral = selectedIncident.isGeneral || isRegionLocation(selectedIncident.location);
      selectedZoom = selectedIncident.zoomLevel || (isGeneral ? 10 : 16);
  }

  // Xử lý nút Chỉ đường
  const handleDirectClick = (incident) => {
      if (!navigator.geolocation) {
          alert("Trình duyệt không hỗ trợ GPS.");
          return;
      }

      navigator.geolocation.getCurrentPosition(
          (pos) => {
              const uPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserPos(uPos);
              setRoutingDest({ lat: incident.lat, lng: incident.lng });
          },
          (err) => {
            console.warn("Lỗi lấy vị trí:", err);
              alert("Không thể lấy vị trí của bạn. Hãy bật GPS và cho phép trình duyệt truy cập.");
          }
      );
  };

  return (
    <MapContainer center={region.center} zoom={region.zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }} zoomControl={false} minZoom={3} maxBounds={maxBounds} maxBoundsViscosity={0.5}>
      <TileLayer attribution={mapAttr} url={mapUrl} />

      <MapLogic coords={selectedCoords} zoomLevel={selectedZoom} region={region} moveTrigger={moveTrigger} />
      <MapEvents setMapInstance={setMapInstance} onZoomChange={setCurrentZoom} />
      <MapUI currentFilter={currentFilter} onFilterChange={onFilterChange} counts={incidentCounts} map={mapInstance} timeFilter={timeFilter} onOpenFilterModal={onOpenFilterModal} />

      {/* 🔥 HIỂN THỊ ĐƯỜNG ĐI KHI CÓ DỮ LIỆU 🔥 */}
      {userPos && routingDest && (
          <RoutingMachine userLocation={userPos} destination={routingDest} />
      )}

      {/* Nút hủy chỉ đường */}
      {userPos && routingDest && (
          <div style={{
              position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'white', padding: '8px 16px', borderRadius: '30px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', gap: '10px', alignItems: 'center',
              animation: 'fadeIn 0.3s'
          }}>
              <span style={{fontWeight: 'bold', color: '#2563eb', fontSize: '13px'}}>
                  <i className="fas fa-route"></i> Đang dẫn đường
              </span>
              <button onClick={() => { setUserPos(null); setRoutingDest(null); }}
                  style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <i className="fas fa-times" style={{fontSize: '12px'}}></i>
              </button>
          </div>
      )}

      {Array.isArray(incidents) && incidents.map(incident => {
         if (!incident.lat || !incident.lng) return null;
         const isGeneralLocation = incident.isGeneral || isRegionLocation(incident.location);
         if (isGeneralLocation) return null;
         if (currentZoom < 5) return null;

         return (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            isSelected={selectedIncident && selectedIncident.id === incident.id}
            createCustomIcon={createCustomIcon}
            onMarkerClick={onMarkerClick}
            getIconClass={getIconClass}
            getTypeName={getTypeName}
            onDirectClick={handleDirectClick} // 🔥 TRUYỀN HÀM XUỐNG ĐÂY
          />
        );
      })}
    </MapContainer>
  );
}

export default MapWrapper;