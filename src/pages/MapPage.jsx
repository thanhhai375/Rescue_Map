import React, { useState, useEffect } from 'react';
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
    onSearchChange,
    timeFilter,
    onOpenFilterModal: handleOpenFilter
  } = useOutletContext();

  const [selectedCoords, setSelectedCoords] = useState(null);

  useEffect(() => {
    setSelectedCoords(null);
  }, [currentRegion]);

  // Hàm này dùng chung cho cả Sidebar Card và Marker trên bản đồ
  const handleCardClick = (lat, lng) => {
    // Cập nhật state để kích hoạt MapLogic (dịch chuyển)
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
        onCardClick={handleCardClick}
      />


      <div className="map-container">
        <MapWrapper
          incidents={incidents}
          region={currentRegion}
          currentFilter={currentFilter}
          onFilterChange={onFilterChange}
          incidentCounts={incidentCounts}
          selectedCoords={selectedCoords}
          timeFilter={timeFilter}
          onOpenFilterModal={handleOpenFilter}
          // THÊM DÒNG NÀY: Truyền hàm xử lý click xuống MapWrapper
          onMarkerClick={handleCardClick}
        />
      </div>
    </div>
  );
}

export default MapPage;