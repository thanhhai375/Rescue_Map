import React from 'react';

function MapUI({ currentFilter, onFilterChange, counts, map }) {

  // NÚT ĐỊNH VỊ (ĐÃ SỬA)
  const handleLocateMe = () => {
    if (!map) {
      alert("Bản đồ chưa sẵn sàng, vui lòng đợi giây lát.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ lấy GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Bay bản đồ đến vị trí của người dùng
        map.flyTo([latitude, longitude], 15);
      },
      () => {
        alert("Không thể lấy vị trí của bạn.");
      }
    );
  };

  return (
    <>
      <div className="map-controls-top">
        <button
          className={`control-btn ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <i className="fas fa-map"></i>
          <span>Tất cả</span>
          <span className="count-badge">{counts.all}</span>
        </button>
        <button
          className={`control-btn ${currentFilter === 'rescue' ? 'active' : ''}`}
          onClick={() => onFilterChange('rescue')}
        >
          <i className="fas fa-ambulance"></i>
          <span>Cần cứu</span>
          <span className="count-badge">{counts.rescue}</span>
        </button>
        <button
          className={`control-btn ${currentFilter === 'help' ? 'active' : ''}`}
          onClick={() => onFilterChange('help')}
        >
          <i className="fas fa-hands-helping"></i>
          <span>Đội cứu hộ</span>
          <span className="count-badge">{counts.help}</span>
        </button>
        <button
          className={`control-btn ${currentFilter === 'warning' ? 'active' : ''}`}
          onClick={() => onFilterChange('warning')}
        >
          <i className="fas fa-exclamation-triangle"></i>
          <span>Cảnh báo</span>
          <span className="count-badge">{counts.warning}</span>
        </button>
      </div>

      <div className="map-controls-bottom">
        <div className="time-indicator">
          <i className="fas fa-clock"></i> 24h
        </div>
        <button className="location-btn" onClick={handleLocateMe}>
          <i className="fas fa-crosshairs"></i>
        </button>
      </div>
    </>
  );
}

export default MapUI;