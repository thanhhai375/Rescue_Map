import React from 'react';

function MapUI({ currentFilter, onFilterChange, counts, map, timeFilter, onOpenFilterModal }) {

  // NÚT ĐỊNH VỊ
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
        // Bay bản đồ đến vị trí của người dùng và phóng to (zoom 16)
        map.flyTo([latitude, longitude], 16, { duration: 2 });
      },
      () => {
        alert("Không thể lấy vị trí của bạn. Vui lòng cấp quyền GPS.");
      }
    );
  };

  // Format chữ hiển thị cho nút thời gian
  const getTimeDisplay = () => {
      if (timeFilter === 'all') return 'All';
      return timeFilter; // VD: 24h, 48h
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
        {/* NÚT THỜI GIAN: Bấm vào mở Modal chọn giờ */}
        <div
            className="time-indicator"
            onClick={onOpenFilterModal}
            style={{cursor: 'pointer'}}
            title="Chọn khoảng thời gian"
        >
          <i className="fas fa-clock"></i> {getTimeDisplay()}
        </div>

        {/* NÚT ĐỊNH VỊ */}
        <button className="location-btn" onClick={handleLocateMe} title="Vị trí của tôi">
          <i className="fas fa-crosshairs"></i>
        </button>
      </div>
    </>
  );
}

export default MapUI;