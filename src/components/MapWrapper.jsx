import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MapUI from './MapUI';

// Hàm tính thời gian tương đối
const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
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

// Logic bay và dịch tâm
function MapLogic({ coords, region }) {
  const map = useMap();

  useEffect(() => {
    if (coords) {
      const targetZoom = 16;
      const targetPoint = map.project(coords, targetZoom);
      // Dịch tâm lên 300px để chừa chỗ cho Popup
      const newTargetPoint = targetPoint.subtract([0, 300]);
      const newCenter = map.unproject(newTargetPoint, targetZoom);

      map.flyTo(newCenter, targetZoom, { duration: 1.5 });
    }
  }, [coords, map]);

  useEffect(() => {
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

function MapWrapper({
  incidents,
  region,
  currentFilter,
  onFilterChange,
  incidentCounts,
  selectedCoords,
  timeFilter,
  onOpenFilterModal,
  onMarkerClick // Nhận prop mới
}) {
  const mapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(region.zoom);
  const MARKER_VISIBLE_THRESHOLD = 8;

  const maxBounds = [[-5, 90], [30, 125]];

  const getIconClass = (type) => {
    switch (type) {
      case 'rescue': return 'fa-ambulance';
      case 'help': return 'fa-hands-helping';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-map-marker-alt';
    }
  };

  const createCustomIcon = (type) => {
    let colorClass = 'marker-default';
    if (type === 'rescue') colorClass = 'marker-rescue';
    if (type === 'help') colorClass = 'marker-help';
    if (type === 'warning') colorClass = 'marker-warning';

    const isPulse = type === 'rescue' ? '<div class="pulse-ring"></div>' : '';
    const iconClass = getIconClass(type);

    return L.divIcon({
      className: `custom-marker-container ${type}`,
      html: `
        <div class="marker-pin ${colorClass}">
          <i class="fas ${iconClass}"></i>
        </div>
        ${isPulse}
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  };

  return (
    <MapContainer
      center={region.center}
      zoom={region.zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      minZoom={5}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
    >
      <TileLayer attribution={mapAttr} url={mapUrl} />
      <MapLogic coords={selectedCoords} region={region} />
      <MapEvents setMapInstance={setMapInstance} onZoomChange={setCurrentZoom} />

      <MapUI
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        counts={incidentCounts}
        map={mapInstance}
        timeFilter={timeFilter}
        onOpenFilterModal={onOpenFilterModal}
      />

      {currentZoom >= MARKER_VISIBLE_THRESHOLD && incidents.map(incident => (
        <Marker
          key={incident.id}
          position={[incident.lat, incident.lng]}
          icon={createCustomIcon(incident.type)}
          // THÊM SỰ KIỆN CLICK CHO MARKER
          eventHandlers={{
            click: () => {
              if (onMarkerClick) {
                // Gọi hàm này sẽ kích hoạt MapLogic (flyTo với offset 300px)
                onMarkerClick(incident.lat, incident.lng);
              }
            },
          }}
        >
          <Popup className="custom-popup" maxWidth={400} autoPan={false}>
            <div className="popup-container">
              <div className="popup-header-section">
                <h3 className="popup-title">{incident.title}</h3>
                <div className="popup-address">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{incident.location}</span>
                </div>
                <div className="popup-google-map">
                  <a
                    href={`https://www.google.com/maps?q=${incident.lat},${incident.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem trên Google Maps <i className="fas fa-external-link-alt"></i>
                  </a>
                </div>
              </div>

              <div className="popup-body-section">
                <div className="popup-meta">
                  <span className={`popup-badge status-${incident.type}`}>
                    <i className={`fas ${getIconClass(incident.type)}`}></i> {getTypeName(incident.type)}
                  </span>
                  <span className="popup-time-ago">
                    {getRelativeTime(incident.time)}
                  </span>
                </div>

                <div className="popup-description">
                  {incident.description}
                </div>

                {incident.sourceLink && (
                  <div className="popup-source">
                    <strong>Nguồn: </strong>
                    <a href={incident.sourceLink} target="_blank" rel="noopener noreferrer">
                      Link bài viết <i className="fas fa-link"></i>
                    </a>
                  </div>
                )}
              </div>

              <div className="popup-disclaimer">
                <i className="fas fa-exclamation-triangle"></i>
                <p>
                  LƯU Ý: Các thông tin kêu gọi tài trợ được đăng tải chưa qua xác minh tính xác thực.
                  Vui lòng kiểm chứng kỹ lưỡng trước khi thực hiện bất kỳ hoạt động hỗ trợ tài chính nào.
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

const getTypeName = (type) => {
    if(type === 'rescue') return 'Cần cứu hộ';
    if(type === 'help') return 'Đội cứu hộ';
    return 'Cảnh báo';
}


export default MapWrapper;