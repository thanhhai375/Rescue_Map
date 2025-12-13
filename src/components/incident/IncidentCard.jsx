import React, { useState } from 'react';
import { updateIncident, deleteIncident } from '../../config/firebaseConfig';

// Utility: Format timestamp to relative time string
const getRelativeTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return 'Vừa xong';

  const now = new Date();
  const incidentTime = new Date(timestamp.seconds * 1000);
  const diffInSeconds = Math.floor((now - incidentTime) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  return incidentTime.toLocaleDateString('vi-VN');
};

function IncidentCard({ incident, onStatusUpdate, isAdmin, handleLogin, onCardClick, onEditIncident }) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Configure UI based on incident type
  let typeName = '';
  let typeColor = '#555';

  switch(incident.type) {
    case 'rescue':
        typeName = 'Cần cứu hộ';
        typeColor = '#d9534f';
        break;
    case 'help':
        typeName = 'Đội cứu hộ';
        typeColor = '#5bc0de';
        break;
    case 'warning':
        typeName = 'Cảnh báo';
        typeColor = '#f0ad4e';
        break;
    case 'supply':
        typeName = 'Cần nhu yếu phẩm';
        typeColor = '#db2777';
        break;
    default:
        typeName = 'Tin tức';
        typeColor = '#8b5cf6';
  }

  // Configure Status Badge
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

  const timeDisplay = getRelativeTime(incident.time);

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

  return (
    <div
      className="incident-card"
      data-type={incident.type}
      onClick={() => onCardClick(incident)}
      style={{ borderLeft: `5px solid ${typeColor}` }}
    >
      <div className="incident-header">
        <div className="incident-header-left">
          <span className="incident-type" style={{ color: typeColor, fontWeight: 'bold' }}>{typeName}</span>
          <span className={`status-badge status-${statusClass}`}>{statusText}</span>
        </div>
        <span className="incident-time" style={{ fontSize: '12px', color: '#718096', fontStyle: 'italic' }}>
            {timeDisplay}
        </span>
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