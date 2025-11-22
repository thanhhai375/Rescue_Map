import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MapUI from './MapUI';

function MapEvents({ setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);
  return null;
}

function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 15);
    }
  }, [coords, map]);
  return null;
}

function MapWrapper({
  incidents,
  region,
  currentFilter,
  onFilterChange,
  incidentCounts,
  selectedCoords,
  hidePOIs // Nhận state 'hidePOIs'
}) {

  // 1. Bản đồ CHI TIẾT (Mặc định)
  const mapUrlDetailed = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapAttrDetailed = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // 2. Bản đồ ĐƠN GIẢN (Sáng sủa, sạch sẽ)
  const mapUrlSimple = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  const mapAttrSimple = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & © <a href="https://carto.com/attributions">CARTO</a>';

  const [mapInstance, setMapInstance] = useState(null);

  const createCustomIcon = (type) => {
    let color = '#eab308';
    if (type === 'rescue') color = '#ec4899';
    if (type === 'help') color = '#f97316';

    return L.divIcon({
      className: `custom-marker custom-marker-${type}`,
      html: `<div style="width: 24px; height: 24px; background-color: ${color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const filteredIncidents = incidents;

  return (
    <MapContainer
      center={region.center}
      zoom={region.zoom}
      scrollWheelZoom={true}
      key={region.name}
    >
      <TileLayer
        attribution={hidePOIs ? mapAttrSimple : mapAttrDetailed}
        url={hidePOIs ? mapUrlSimple : mapUrlDetailed}
        key={hidePOIs ? 'simple' : 'detailed'}
      />

      <MapEvents setMapInstance={setMapInstance} />

      <MapUI
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        counts={incidentCounts}
        map={mapInstance}
      />

      {filteredIncidents.map(incident => (
        <Marker
          key={incident.id}
          position={[incident.lat, incident.lng]}
          icon={createCustomIcon(incident.type)}
        >
          <Popup>
            <h3 style={{margin: '0 0 5px', fontSize: '14px'}}>{incident.title}</h3>
            <p style={{margin: 0, fontSize: '12px'}}>{incident.location}</p>
          </Popup>
        </Marker>
      ))}

      <MapFlyTo coords={selectedCoords} />
    </MapContainer>
  );
}

export default MapWrapper;