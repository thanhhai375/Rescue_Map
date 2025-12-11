import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MapUI from './MapUI';

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

// --- LOGIC MAP: SỬ DỤNG PIXEL OFFSET (CHÍNH XÁC TUYỆT ĐỐI) ---
function MapLogic({ coords, zoomLevel, region, moveTrigger }) {
  const map = useMap();

  const lat = coords ? coords[0] : null;
  const lng = coords ? coords[1] : null;
  const regionKey = region ? region.key : null;

  useEffect(() => {
    if (lat !== null && lng !== null) {
      try {
        const targetZoom = zoomLevel || 16;

        // 1. Chuyển đổi tọa độ GPS sang tọa độ điểm ảnh (Pixel) tại mức zoom đích
        const targetPoint = map.project([lat, lng], targetZoom);

        // 2. TÍNH TOÁN ĐỘ LỆCH (OFFSET)
        // - Y - 180: Dịch tâm bản đồ lên trên 180px => Marker trôi xuống dưới (để né Header và hiển thị Popup)
        // - X - 100: Dịch tâm bản đồ sang trái 100px => Marker trôi sang phải (để né Sidebar)
        // Bạn có thể chỉnh số 180 và 100 này tùy ý
        const flyToPoint = L.point(targetPoint.x - 100, targetPoint.y - 180);

        // 3. Chuyển ngược lại từ Pixel sang GPS để flyTo
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

const IncidentMarker = ({ incident, isSelected, createCustomIcon, onMarkerClick, getIconClass, getTypeName }) => {
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
            <Popup
                className="custom-popup"
                maxWidth={320}
                // Tắt autoPan vì ta đã tính toán vị trí chuẩn bằng pixel rồi
                autoPan={false}
            >
               <div className="popup-container">
                  <div className="popup-header-section">
                    <h3 className="popup-title">{incident.title}</h3>
                    <div className="popup-address">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{incident.location} {incident.isGeneral ? "(Khu vực chung)" : ""}</span>
                    </div>
                      <div className="popup-google-map">
                      <a href={`http://googleusercontent.com/maps.google.com/maps?q=${incident.lat},${incident.lng}`} target="_blank" rel="noopener noreferrer">
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
                             <img src={incident.image} alt="Ảnh" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} onError={(e) => { e.target.style.display = 'none'; }} />
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

  // 1. Sửa hàm getIconClass
const getIconClass = (type) => {
  switch (type) {
    case 'rescue': return 'fa-ambulance';
    case 'supply': return 'fa-box-open'; // <--- THÊM ICON HỘP
    case 'help': return 'fa-hands-helping';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-newspaper';
  }
};

// 2. Sửa hàm getTypeName
const getTypeName = (type) => {
  if(type === 'rescue') return 'Cần cứu hộ';
  if(type === 'supply') return 'Nhu yếu phẩm'; // <--- THÊM TÊN
  if(type === 'help') return 'Đội cứu hộ';
  if(type === 'warning') return 'Cảnh báo';
  return 'Tin tức';
}
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
      selectedZoom = selectedIncident.zoomLevel || (selectedIncident.isGeneral ? 10 : 16);
  }

  return (
    <MapContainer
        center={region.center}
        zoom={region.zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        minZoom={3}
        maxBounds={maxBounds}
        maxBoundsViscosity={0.5}
    >
      <TileLayer attribution={mapAttr} url={mapUrl} />

      <MapLogic
          coords={selectedCoords}
          zoomLevel={selectedZoom}
          region={region}
          moveTrigger={moveTrigger}
      />

      <MapEvents setMapInstance={setMapInstance} onZoomChange={setCurrentZoom} />
      <MapUI currentFilter={currentFilter} onFilterChange={onFilterChange} counts={incidentCounts} map={mapInstance} timeFilter={timeFilter} onOpenFilterModal={onOpenFilterModal} />

      {Array.isArray(incidents) && incidents.map(incident => {
         if (!incident.lat || !incident.lng) return null;
         if (currentZoom < 5) return null;
         return (
          <IncidentMarker key={incident.id} incident={incident} isSelected={selectedIncident && selectedIncident.id === incident.id} createCustomIcon={createCustomIcon} onMarkerClick={onMarkerClick} getIconClass={getIconClass} getTypeName={getTypeName} />
        );
      })}
    </MapContainer>
  );
}

export default MapWrapper;