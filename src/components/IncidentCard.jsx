import React, { useState } from 'react';
import { updateIncident, deleteIncident } from '../firebaseConfig';

function IncidentCard({ incident, onStatusUpdate, isAdmin, handleLogin, onCardClick, onEditIncident }) {
  const [isUpdating, setIsUpdating] = useState(false);

  // --- SỬA LỖI 1: XỬ LÝ HIỂN THỊ LOẠI TIN ---
  let typeName = '';
  switch(incident.type) {
    case 'rescue': typeName = 'Cần cứu hộ'; break;
    case 'help': typeName = 'Đội cứu hộ'; break;
    case 'warning': typeName = 'Cảnh báo'; break;
    case 'news': typeName = 'Tin tức'; break; // Thêm dòng này
    default: typeName = 'Tin tức'; // Đổi mặc định thành Tin tức thay vì "Không rõ"
  }

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
      alert("Bạn phải đăng nhập với tư cách Quản lý để thực hiện việc này.");
      try {
        await handleLogin();
      } catch (error) {
        console.error("Lỗi đăng nhập:", error);
      }
      return;
    }
    setIsUpdating(true);
    try {
      await updateIncident(incident.id, { status: newStatus });
      onStatusUpdate();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert("Cập nhật thất bại, vui lòng thử lại.");
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
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn phản ánh này?")) {
      setIsUpdating(true);
      try {
        await deleteIncident(incident.id);
        onStatusUpdate();
      } catch (error) {
        console.error("Lỗi xóa bài:", error);
        alert("Xóa thất bại, vui lòng thử lại.");
      } finally {
        setIsUpdating(false);
    }
    }
  };

  const handleEditClick = (event) => {
      event.stopPropagation();
      if (onEditIncident) {
          onEditIncident(incident);
      }
  };

  // --- SỬA LỖI 3: LINK GOOGLE MAPS ---
  // Code cũ: 0{incident.lat} (sai cú pháp) -> Code mới: ${incident.lat}
  const googleMapsLink = incident.lat && incident.lng
    ? `http://googleusercontent.com/maps.google.com/?q=${incident.lat},${incident.lng}`
    : null;

  return (
    <div
      className="incident-card"
      data-type={incident.type}
      onClick={() => onCardClick(incident.lat, incident.lng)}
    >
      <div className="incident-header">
        <div className="incident-header-left">
          <span className="incident-type">{typeName}</span>
          <span className={`status-badge status-${statusClass}`}>{statusText}</span>
        </div>
        <span className="incident-time">{time}</span>
      </div>
      <div className="incident-title">{incident.title}</div>
      <div className="incident-location">
        <i className="fas fa-map-marker-alt"></i>
        <span>{incident.location}</span>
      </div>

      {/* --- SỬA LỖI 2: XỬ LÝ ẢNH --- */}
      {/* Chỉ hiện nếu có link ảnh và tự động ẩn (display: none) nếu ảnh lỗi */}
      {incident.image && incident.image !== "" && (
        <img
            src={incident.image}
            className="incident-image"
            alt={incident.title}
            onError={(e) => e.target.style.display = 'none'}
        />
      )}

      <div className="incident-links">
        <div>
          {incident.sourceLink ? (
            <a href={incident.sourceLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Nguồn Link
            </a>
          ) : (
            <span style={{color: '#aaa', fontSize: '13px'}}>Không có nguồn</span>
          )}

          {googleMapsLink ? (
            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Google Maps Link
            </a>
          ) : (
            <span style={{color: '#aaa', fontSize: '13px'}}>Chưa có tọa độ</span>
          )}
        </div>

        {/* Nút Edit chỉ hiện cho Admin */}
        {isAdmin && (
            <button className="bookmark-btn" title="Chỉnh sửa" onClick={handleEditClick} style={{marginRight: '8px', color: '#3b82f6'}}>
                <i className="fas fa-edit"></i>
            </button>
        )}

        <button className="bookmark-btn" onClick={(e) => e.stopPropagation()}>
          <i className="far fa-bookmark"></i>
        </button>
      </div>

      {isAdmin && (
        <div className="incident-actions">
          {currentStatus === 'pending' && (
            <>
              <button
                className="action-btn btn-approve"
                onClick={(e) => handleStatusUpdate('new', e)}
                disabled={isUpdating}
              >
                <i className="fas fa-check"></i> {isUpdating ? "..." : "Duyệt"}
              </button>
              <button
                className="action-btn btn-delete"
                onClick={handleDelete}
                disabled={isUpdating}
              >
                <i className="fas fa-trash"></i> {isUpdating ? "..." : "Xóa"}
              </button>
            </>
          )}

          {currentStatus === 'new' && (
            <button
              className="action-btn btn-process"
              onClick={(e) => handleStatusUpdate('processing', e)}
              disabled={isUpdating}
            >
              <i className="fas fa-cogs"></i> {isUpdating ? "..." : "Nhận xử lý"}
            </button>
          )}

          {currentStatus === 'processing' && (
            <button
              className="action-btn btn-resolve"
              onClick={(e) => handleStatusUpdate('resolved', e)}
              disabled={isUpdating}
            >
              <i className="fas fa-check-circle"></i> {isUpdating ? "..." : "Đã cứu hộ"}
            </button>
          )}

          {currentStatus !== 'pending' && (
            <button
              className="action-btn btn-delete"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              <i className="fas fa-trash"></i> {isUpdating ? "..." : "Xóa"}
            </button>
          )}

        </div>
      )}
    </div>
  );
}

export default IncidentCard;