import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MapWrapper from '../components/MapWrapper';

// --- CHÈN COMPONENT DETAIL MODAL VÀO ĐÂY (Hoặc import từ file riêng) ---
// (Dán đoạn code DetailModal ở Bước 1 vào đây)
// ------------------------------------------------------------------

function MapPage() {
  const {
    incidents, onOpenModal, onOpenFilterModal, onIncidentAdded,
    user, isAdmin, handleLogin, currentRegion, currentFilter,
    onFilterChange, incidentCounts, searchQuery, onSearchChange,
    timeFilter, onOpenFilterModal: handleOpenFilter, onEditIncident
  } = useOutletContext();

  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    setSelectedIncident(null);
  }, [currentRegion]);

  // Hàm xử lý click
  const handleCardClick = (incident) => {
    if (!incident) return;
    // Cứ set vào state, việc hiển thị Map hay Modal sẽ do logic ở dưới quyết định
    setSelectedIncident(incident);
  };

  // Logic kiểm tra xem có cần hiện Modal giữa màn hình không
  // Điều kiện: Có bài được chọn VÀ (thiếu lat HOẶC thiếu lng)
  const shouldShowModal = selectedIncident && (!selectedIncident.lat || !selectedIncident.lng);

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
        onEditIncident={onEditIncident}
      />

      <div className="map-container" style={{ position: 'relative' }}>
        <MapWrapper
          incidents={incidents}
          region={currentRegion}
          currentFilter={currentFilter}
          onFilterChange={onFilterChange}
          incidentCounts={incidentCounts}
          // Chỉ truyền xuống MapWrapper nếu CÓ tọa độ để tránh lỗi map
          selectedIncident={(!shouldShowModal) ? selectedIncident : null}
          timeFilter={timeFilter}
          onOpenFilterModal={handleOpenFilter}
          onMarkerClick={handleCardClick}
        />

        {/* 🔥 HIỂN THỊ MODAL NẾU KHÔNG CÓ TỌA ĐỘ 🔥 */}
        {shouldShowModal && (
          <DetailModal
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        )}
      </div>
    </div>
  );
}
// Component hiển thị thông tin chi tiết giữa màn hình
function DetailModal({ incident, onClose }) {
  if (!incident) return null;

  // Tái sử dụng logic màu sắc
  let typeName = 'Tin tức';
  let typeColor = '#8b5cf6';
  switch(incident.type) {
    case 'rescue': typeName = 'Cần cứu hộ'; typeColor = '#d9534f'; break;
    case 'help': typeName = 'Đội cứu hộ'; typeColor = '#5bc0de'; break;
    case 'warning': typeName = 'Cảnh báo'; typeColor = '#f0ad4e'; break;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', padding: '20px', borderRadius: '12px',
        width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>

        {/* Nút đóng */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666'
        }}>
          <i className="fas fa-times"></i>
        </button>

        {/* Header */}
        <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <span style={{
            backgroundColor: typeColor, color: 'white',
            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
          }}>
            {typeName}
          </span>
          <h2 style={{ marginTop: '10px', fontSize: '18px', color: '#333' }}>{incident.title}</h2>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
            <i className="fas fa-clock"></i> {incident.time ? new Date(incident.time.seconds * 1000).toLocaleString('vi-VN') : 'Vừa xong'}
          </div>
        </div>

        {/* Nội dung */}
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
          <p style={{marginBottom: '10px'}}><strong>Mô tả:</strong> {incident.description}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#d9534f', marginBottom: '10px', fontSize: '13px' }}>
             <i className="fas fa-map-marker-alt"></i>
             <em>{incident.location || "Chưa xác định vị trí"}</em>
          </div>

          {incident.image && incident.image.startsWith('http') && (
            <img src={incident.image} alt="Ảnh tin"
                 style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', marginTop: '10px' }}
                 onError={(e) => e.target.style.display='none'} />
          )}

          {incident.sourceLink && (
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <a href={incident.sourceLink} target="_blank" rel="noopener noreferrer"
                 style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
                 Xem bài viết gốc <i className="fas fa-external-link-alt"></i>
              </a>
            </div>
          )}
        </div>

        {/* Footer cảnh báo */}
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '5px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <i className="fas fa-exclamation-triangle"></i>
           <span>Bài viết này chưa có tọa độ cụ thể trên bản đồ.</span>
        </div>

      </div>
    </div>
  );
}
export default MapPage;