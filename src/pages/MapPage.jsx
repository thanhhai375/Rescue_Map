import React, { useState } from 'react'; // Thêm useState
import { useOutletContext } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapWrapper from '../components/MapWrapper';

function MapPage() {
  const {
    incidents,
    onOpenModal,
    onOpenFilterModal,
    onIncidentAdded,
    user,
    isAdmin,
    handleLogin,
    currentRegion,
    currentFilter,
    onFilterChange,
    incidentCounts,
    searchQuery,
    onSearchChange
  } = useOutletContext();

  // STATE MỚI: Lưu tọa độ (lat, lng) khi nhấn vào card
  const [selectedCoords, setSelectedCoords] = useState(null);

  // HÀM MỚI: Được gọi từ IncidentCard
  const handleCardClick = (lat, lng) => {
    setSelectedCoords([lat, lng]);
  };

  return (
    <div className="container">
      <Sidebar
        incidents={incidents}
        onOpenModal={onOpenModal}
        onOpenFilterModal={onOpenFilterModal}
        onIncidentAdded={onIncidentAdded}
        user={user}
        isAdmin={isAdmin}
        handleLogin={handleLogin}
        currentFilter={currentFilter}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onCardClick={handleCardClick} // Truyền hàm xử lý click xuống
      />

      <div className="map-container">
        <MapWrapper
          incidents={incidents}
          region={currentRegion}
          currentFilter={currentFilter}
          onFilterChange={onFilterChange}
          incidentCounts={incidentCounts}
          selectedCoords={selectedCoords} // Truyền tọa độ được chọn xuống
        />
      </div>
    </div>
  );
}

export default MapPage;