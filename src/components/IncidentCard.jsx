import React, { useState } from 'react';
import { updateIncident, deleteIncident } from '../firebaseConfig';

function IncidentCard({ incident, onStatusUpdate, isAdmin, handleLogin, onCardClick, onEditIncident }) {
  const [isUpdating, setIsUpdating] = useState(false);

  // --- XỬ LÝ MÀU SẮC THEO LOẠI TIN ---
  let typeName = '';
  let typeColor = '#555'; // Màu mặc định

  switch(incident.type) {
    case 'rescue':
        typeName = 'Cần cứu hộ';
        typeColor = '#d9534f'; // Đỏ
        break;
    case 'help':
        typeName = 'Đội cứu hộ';
        typeColor = '#5bc0de'; // Xanh
        break;
    case 'warning':
        typeName = 'Cảnh báo';
        typeColor = '#f0ad4e'; // Cam
        break;
    default:
        typeName = 'Tin tức';
        typeColor = '#8b5cf6'; // Tím (Map với CSS mới)
  }

  // --- XỬ LÝ TRẠNG THÁI ---
  let statusText = 'Mới';
  let statusClass = 'new';
  const currentStatus = incident.status || 'new';

  if (currentStatus === 'pending') {
    statusText = 'Chờ duyệt';
    statusClass = 'new';
  } else if (currentStatus === 'processing') {
    statusText = 'Đang xử lý';
    statusClass = 'processing';
  } else if (currentStatus === 'resolved') {
    statusText = 'Đã cứu hộ';
    statusClass = 'resolved';
  }

  const time = incident.time ? new Date(incident.time.seconds * 1000).toLocaleString('vi-VN') : 'Vừa xong';

  const handleStatusUpdate = async (newStatus, event) => {
    event.stopPropagation();
    if (!isAdmin) {
      alert("Bạn phải đăng nhập với tư cách Quản lý.");
      try { await handleLogin(); } catch (error) {  alert("",error);}
      return;
    }
    setIsUpdating(true);
    try {
      await updateIncident(incident.id, { status: newStatus });
      onStatusUpdate();
    } catch (error) {
      console.error(error);
      alert("Lỗi cập nhật.");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDelete = async (event) => {
    event.stopPropagation();
    if (!isAdmin) {
      alert("Chỉ Quản lý mới được xóa bài.");
      await handleLogin();
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn?")) {
      setIsUpdating(true);
      try {
        await deleteIncident(incident.id);
        onStatusUpdate();
      } catch (error) {
        alert("Lỗi xóa bài.",error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleEditClick = (event) => {
      event.stopPropagation();
      if (onEditIncident) onEditIncident(incident);
  };

  const googleMapsLink = incident.lat && incident.lng
    ? `http://googleusercontent.com/maps.google.com/maps?q=${incident.lat},${incident.lng}`
    : null;

  return (
    <div
      className="incident-card"
      data-type={incident.type}
      // 🔥 THAY ĐỔI Ở ĐÂY: Truyền cả object incident thay vì chỉ lat, lng
      onClick={() => onCardClick(incident)}
      style={{ borderLeft: `5px solid ${typeColor}` }}
    >
      <div className="incident-header">
        <div className="incident-header-left">
          <span className="incident-type" style={{ color: typeColor, fontWeight: 'bold' }}>{typeName}</span>
          <span className={`status-badge status-${statusClass}`}>{statusText}</span>
        </div>
        <span className="incident-time" style={{ fontSize: '12px', color: '#999' }}>{time}</span>
      </div>

      <div className="incident-title" style={{ fontWeight: '600', margin: '8px 0' }}>{incident.title}</div>

      <div className="incident-location" style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
        <i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }}></i>
        <span>{incident.location || "Chưa xác định"}</span>
      </div>

      {incident.image && incident.image.startsWith('http') && (
        <div className="incident-image-wrapper" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '10px' }}>
            <img
                src={incident.image}
                alt="Ảnh hiện trường"
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.display = 'none';
                }}
            />
        </div>
      )}

      <div className="incident-links" style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
        <div>
          {incident.sourceLink ? (
            <a href={incident.sourceLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ marginRight: '10px', color: '#007bff' }}>
               <i className="fas fa-external-link-alt"></i> Nguồn
            </a>
          ) : (
            <span style={{ color: '#aaa', fontSize: '13px' }}>Không nguồn</span>
          )}

          {googleMapsLink && (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#28a745' }}>
               <i className="fas fa-map"></i> Chỉ đường
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
             {isAdmin && (
                <button className="bookmark-btn" title="Sửa" onClick={handleEditClick} style={{ color: '#333' }}>
                    <i className="fas fa-edit"></i>
                </button>
             )}
        </div>
      </div>

      {isAdmin && (
        <div className="incident-actions" style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
          {currentStatus === 'pending' && (
            <>
              <button className="action-btn btn-approve" onClick={(e) => handleStatusUpdate('new', e)} disabled={isUpdating} title="Duyệt bài">
                <i className="fas fa-check"></i>
              </button>
              <button className="action-btn btn-delete" onClick={handleDelete} disabled={isUpdating} title="Xóa bài">
                <i className="fas fa-trash"></i>
              </button>
            </>
          )}

          {currentStatus === 'new' && (
            <button className="action-btn btn-process" onClick={(e) => handleStatusUpdate('processing', e)} disabled={isUpdating}>
              <i className="fas fa-running"></i> Xử lý
            </button>
          )}

          {currentStatus === 'processing' && (
            <button className="action-btn btn-resolve" onClick={(e) => handleStatusUpdate('resolved', e)} disabled={isUpdating}>
              <i className="fas fa-flag-checkered"></i> Xong
            </button>
          )}

          {currentStatus !== 'pending' && (
             <button className="action-btn btn-delete" onClick={handleDelete} disabled={isUpdating} style={{ marginLeft: 'auto', background: 'none', color: 'red', border: 'none' }}>
               <i className="fas fa-trash"></i>
             </button>
          )}
        </div>
      )}
    </div>
  );
}

export default IncidentCard;