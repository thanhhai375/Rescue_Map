import React from 'react';

function FilterModal({
  isOpen,
  onClose,
  timeFilter,
  onTimeFilterChange,
  distanceFilter,
  onDistanceFilterChange,
  hidePOIs,
  onHidePOIsChange
}) {

  if (!isOpen) {
    return null;
  }

  const handlePOIsChange = (event) => {
    onHidePOIsChange(event.target.checked);
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="filter-modal-header">
          <h3>Bộ lọc sự kiện</h3>
          <button className="filter-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="filter-modal-body">

          <div className="filter-group">
            <h4>Khoảng thời gian</h4>
            <div className="filter-options">
              {/* --- THÊM NÚT TẤT CẢ --- */}
              <button
                className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('all')}
              >
                Tất cả
              </button>
              {/* ----------------------- */}

              <button
                className={`filter-btn ${timeFilter === '1h' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('1h')}
              >
                1 giờ
              </button>
              <button
                className={`filter-btn ${timeFilter === '3h' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('3h')}
              >
                3 giờ
              </button>
              <button
                className={`filter-btn ${timeFilter === '6h' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('6h')}
              >
                6 giờ
              </button>
              <button
                className={`filter-btn ${timeFilter === '12h' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('12h')}
              >
                12 giờ
              </button>
              <button
                className={`filter-btn ${timeFilter === '24h' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('24h')}
              >
                24 giờ
              </button>
              <button
                className={`filter-btn ${timeFilter === '48h' ? 'active' : ''}`}
                onClick={() => onTimeFilterChange('48h')}
              >
                48 giờ
              </button>
            </div>
          </div>

          <div className="filter-group">
            <h4>Khoảng cách</h4>
            <div className="filter-options">
              <button
                className={`filter-btn ${distanceFilter === '1km' ? 'active' : ''}`}
                onClick={() => onDistanceFilterChange('1km')}
              >
                1 km
              </button>
              <button
                className={`filter-btn ${distanceFilter === '5km' ? 'active' : ''}`}
                onClick={() => onDistanceFilterChange('5km')}
              >
                5 km
              </button>
              <button
                className={`filter-btn ${distanceFilter === '10km' ? 'active' : ''}`}
                onClick={() => onDistanceFilterChange('10km')}
              >
                10 km
              </button>
              <button
                className={`filter-btn ${distanceFilter === '50km' ? 'active' : ''}`}
                onClick={() => onDistanceFilterChange('50km')}
              >
                50 km
              </button>
              <button
                className={`filter-btn ${distanceFilter === '100km' ? 'active' : ''}`}
                onClick={() => onDistanceFilterChange('100km')}
              >
                100 km
              </button>
              <button
                className={`filter-btn ${distanceFilter === '>100km' ? 'active' : ''}`}
                onClick={() => onDistanceFilterChange('>100km')}
              >
                {'>'}100km
              </button>
            </div>
          </div>

          <div className="filter-group">
            <h4>Hiển thị bản đồ</h4>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={hidePOIs}
                onChange={handlePOIsChange}
              />
              <span>Ẩn địa điểm (Bệnh viện, Trạm xăng,...)</span>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
}


export default FilterModal;