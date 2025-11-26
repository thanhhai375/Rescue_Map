import React, { useState } from 'react';
import IncidentList from './IncidentList';

function Sidebar({
  incidents,
  onOpenModal,
  onOpenFilterModal,
  onIncidentAdded,
  isAdmin,        // Giữ lại để truyền xuống IncidentList
  handleLogin,    // Giữ lại để truyền xuống IncidentList
  currentFilter,
  searchQuery,
  onSearchChange,
  onCardClick,
  onEditIncident
}) {

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : ''}`}>

      {/* Thanh kéo cho Mobile */}
      <div className="sidebar-handle-container mobile-only" onClick={toggleExpand}>
        <div className="sidebar-handle"></div>
      </div>

      <div className="search-box">
        <div className="search-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm địa điểm, SĐT..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />
        </div>
        <button className="filter-btn" onClick={onOpenFilterModal}>
          <i className="fas fa-sliders-h"></i>
        </button>
      </div>

      <IncidentList
        incidents={incidents}
        onIncidentAdded={onIncidentAdded}
        isAdmin={isAdmin}
        handleLogin={handleLogin}
        currentFilter={currentFilter}
        onCardClick={onCardClick}
        onEditIncident={onEditIncident}
      />

      <div className="sidebar-footer">
        <button className="report-btn-sidebar" onClick={onOpenModal}>
          <i className="fas fa-plus"></i> Gửi yêu cầu cứu hộ
        </button>
      </div>
    </div>
  );
}


export default Sidebar;