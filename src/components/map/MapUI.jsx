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
        {/* Nút Tất cả */}
        <button className={`control-btn ${currentFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>
          <i className="fas fa-layer-group"></i> <span>Tất cả</span>
        </button>

        {/* Nút Cần cứu */}
        <button className={`control-btn ${currentFilter === 'rescue' ? 'active' : ''}`} onClick={() => onFilterChange('rescue')}>
          <i className="fas fa-ambulance"></i> <span>Cần cứu</span> <span className="count-badge">{counts.rescue}</span>
        </button>

        {/* Nút Đội cứu hộ */}
        <button className={`control-btn ${currentFilter === 'help' ? 'active' : ''}`} onClick={() => onFilterChange('help')}>
          <i className="fas fa-hands-helping"></i> <span>Cứu trợ</span> <span className="count-badge">{counts.help}</span>
        </button>

        {/* Nút Cảnh báo */}
        <button className={`control-btn ${currentFilter === 'warning' ? 'active' : ''}`} onClick={() => onFilterChange('warning')}>
          <i className="fas fa-exclamation-triangle"></i> <span>Cảnh báo</span> <span className="count-badge">{counts.warning}</span>
        </button>
        <button className={`control-btn ${currentFilter === 'supply' ? 'active' : ''}`} onClick={() => onFilterChange('supply')}>
  <i className="fas fa-box-open"></i> <span>Vật tư</span> <span className="count-badge">{counts.supply || 0}</span>
</button>

        {/* --- NÚT MỚI: TIN TỨC --- */}
        <button
          className={`control-btn ${currentFilter === 'news' ? 'active' : ''}`}
          onClick={() => onFilterChange('news')}
          style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}
        >
          <i className="fas fa-newspaper"></i> <span>Tin tức</span> <span className="count-badge">{counts.news || 0}</span>
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