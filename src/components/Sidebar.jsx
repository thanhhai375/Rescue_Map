import React, { useState, useEffect, useRef } from 'react';
import IncidentList from './IncidentList';
import { auth } from '../firebaseConfig';
import { scanNewsWithAI } from '../utils/geminiScanner';

// CẤU HÌNH: Tự động quét mỗi 60 phút
const AUTO_SCAN_INTERVAL = 60 * 60 * 1000;

// --- 1. COMPONENT THÔNG BÁO ĐẸP (MỚI) ---
const NotificationModal = ({ message, type, onClose }) => {
  useEffect(() => {
    // Tự động tắt sau 3 giây
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Cấu hình màu sắc và icon theo loại thông báo
  let icon = 'fa-info-circle';
  let iconColor = '#3b82f6'; // Blue
  let title = 'Thông báo';

  if (type === 'success') {
    icon = 'fa-check-circle';
    iconColor = '#10b981'; // Green
    title = 'Thành công';
  } else if (type === 'error') {
    icon = 'fa-exclamation-circle';
    iconColor = '#ef4444'; // Red
    title = 'Lỗi';
  } else if (type === 'warning') {
    icon = 'fa-exclamation-triangle';
    iconColor = '#f59e0b'; // Orange
    title = 'Lưu ý';
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)', // Nền mờ nhẹ
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', padding: '20px 30px', borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minWidth: '300px', maxWidth: '400px',
        transform: 'translateY(0)', animation: 'slideDown 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
      }} onClick={e => e.stopPropagation()}>

        <i className={`fas ${icon}`} style={{ fontSize: '40px', color: iconColor, marginBottom: '15px' }}></i>

        <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '18px' }}>{title}</h3>

        <p style={{ margin: 0, color: '#666', textAlign: 'center', lineHeight: '1.5', fontSize: '14px' }}>
          {message}
        </p>

      </div>

      {/* Thêm keyframe animation inline */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// --- 2. COMPONENT SIDEBAR CHÍNH ---
function Sidebar({
  incidents, onOpenModal, onOpenFilterModal, onIncidentAdded,
  user, isAdmin, handleLogin, currentFilter, searchQuery, onSearchChange, onCardClick, onEditIncident
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);

  // State quản lý thông báo (null = không hiện)
  const [notification, setNotification] = useState(null);

  const scanIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasInitialScanRun = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  // Hàm hiển thị thông báo thay cho alert
  const showNotify = (message, type = 'info') => {
      if (isMountedRef.current) {
          setNotification({ message, type });
      }
  };

  // --- HÀM QUÉT TIN (ĐÃ SỬA DÙNG NOTIFICATION) ---
  const performScan = async (isAuto = false) => {
    if (isScanning) return;
    if (isMountedRef.current) setIsScanning(true);

    try {
      const result = await scanNewsWithAI();

      if (!isMountedRef.current) return;

      if (!result) {
         console.log("Hệ thống: Quét xong nhưng không có tin mới.");
         if (!isAuto) {
             // THAY ALERT BẰNG NOTIFY
             showNotify("Hiện chưa có tin tức mới nào cần cập nhật.", "warning");
         }
         setLastScanTime(new Date());
         setIsScanning(false);
         return;
      }

      // Có tin mới
      if (!isAuto) {
        const message = result.title
            ? `Đã tìm thấy và thêm tin mới:\n"${result.title}"`
            : `Hệ thống đã cập nhật dữ liệu tin tức mới thành công.`;

        // THAY ALERT BẰNG NOTIFY
        showNotify(message, "success");
      }

      if (onIncidentAdded) onIncidentAdded();
      setLastScanTime(new Date());

    } catch (error) {
      console.error("Lỗi quét:", error);
      if (!isAuto && isMountedRef.current) {
          // THAY ALERT BẰNG NOTIFY
          showNotify(`Lỗi hệ thống: ${error.message || "Vui lòng kiểm tra kết nối."}`, "error");
      }
    } finally {
      if (isMountedRef.current) setIsScanning(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      if (!hasInitialScanRun.current) {
         performScan(true);
         hasInitialScanRun.current = true;
      }
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(() => {
        performScan(true);
      }, AUTO_SCAN_INTERVAL);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [user, isAdmin]);

  return (
    <div className="sidebar">
      {/* 3. HIỂN THỊ COMPONENT THÔNG BÁO NẾU CÓ STATE */}
      {notification && (
          <NotificationModal
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
          />
      )}

      <div className="admin-panel">
        {user && isAdmin ? (
          <div className="admin-info-container">
            <div className="admin-info">
              <span>Chào Admin: <strong>{user.email}</strong></span>
              <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
            </div>

            <button
              className="ai-scan-btn"
              onClick={() => performScan(false)}
              disabled={isScanning}
            >
              {isScanning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-robot"></i>}
              {isScanning ? " Đang phân tích..." : " Quét ngay bây giờ"}
            </button>

            <div style={{fontSize: '11px', color: '#6b7280', marginTop: '5px', textAlign: 'center'}}>
              <i className="fas fa-clock"></i> Tự động quét mỗi 60 phút. <br/>
              Lần cuối: {lastScanTime ? lastScanTime.toLocaleTimeString('vi-VN') : 'Chưa quét'}
            </div>
          </div>
        ) : user ? (
          <div className="admin-info">
            <span>Chào bạn: <strong>{user.email}</strong></span>
            <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="login-btn">
            Đăng nhập (Quản lý)
          </button>
        )}
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
        user={user}
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