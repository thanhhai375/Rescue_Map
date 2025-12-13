import React from 'react';

function MapUI({ currentFilter, onFilterChange, counts, map, timeFilter, onOpenFilterModal }) {

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
        map.flyTo([latitude, longitude], 16, { duration: 2 });
      },
      () => {
        alert("Không thể lấy vị trí của bạn. Vui lòng cấp quyền GPS.");
      }
    );
  };

  const getTimeDisplay = () => {
      if (timeFilter === 'all') return 'All';
      return timeFilter;
  };

  return (
    <>
      <div className="map-controls-top">
        <button className={`control-btn ${currentFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>
          <i className="fas fa-layer-group"></i> <span>Tất cả</span>
        </button>

        <button className={`control-btn ${currentFilter === 'rescue' ? 'active' : ''}`} onClick={() => onFilterChange('rescue')}>
          <i className="fas fa-ambulance"></i> <span>Cần cứu</span> <span className="count-badge">{counts.rescue}</span>
        </button>

        <button className={`control-btn ${currentFilter === 'help' ? 'active' : ''}`} onClick={() => onFilterChange('help')}>
          <i className="fas fa-hands-helping"></i> <span>Cứu trợ</span> <span className="count-badge">{counts.help}</span>
        </button>

        <button className={`control-btn ${currentFilter === 'warning' ? 'active' : ''}`} onClick={() => onFilterChange('warning')}>
          <i className="fas fa-exclamation-triangle"></i> <span>Cảnh báo</span> <span className="count-badge">{counts.warning}</span>
        </button>

        <button className={`control-btn ${currentFilter === 'supply' ? 'active' : ''}`} onClick={() => onFilterChange('supply')}>
          <i className="fas fa-box-open"></i> <span>Vật tư</span> <span className="count-badge">{counts.supply || 0}</span>
        </button>

        <button
          className={`control-btn ${currentFilter === 'news' ? 'active' : ''}`}
          onClick={() => onFilterChange('news')}
          style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}
        >
          <i className="fas fa-newspaper"></i> <span>Tin tức</span> <span className="count-badge">{counts.news || 0}</span>
        </button>
      </div>

      <div className="map-controls-bottom">
        <div
            className="time-indicator"
            onClick={onOpenFilterModal}
            style={{cursor: 'pointer'}}
            title="Chọn khoảng thời gian"
        >
          <i className="fas fa-clock"></i> {getTimeDisplay()}
        </div>

        <button className="location-btn" onClick={handleLocateMe} title="Vị trí của tôi">
          <i className="fas fa-crosshairs"></i>
        </button>
      </div>
    </>
  );
}

export default MapUI;