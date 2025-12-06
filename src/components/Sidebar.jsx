import React, { useState, useEffect, useRef } from 'react';
import IncidentList from './IncidentList';
import { auth } from '../firebaseConfig';
import { scanNewsWithAI } from '../utils/geminiScanner';

// CẤU HÌNH: Tự động quét mỗi 60 phút
const AUTO_SCAN_INTERVAL = 60 * 60 * 1000;

function Sidebar({
  incidents,
  onOpenModal,
  onOpenFilterModal,
  onIncidentAdded,
  user,
  isAdmin,
  handleLogin,
  currentFilter,
  searchQuery,
  onSearchChange,
  onCardClick
}) {

  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  const scanIntervalRef = useRef(null);

  const handleLogout = () => {
    auth.signOut();
  };

  // Hàm quét tin (Dùng chung cho cả Tự động và Thủ công)
  const performScan = async (isAuto = false) => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const result = await scanNewsWithAI();

      // --- SỬA ĐOẠN NÀY ĐỂ CHẶN LỖI NULL ---
      if (!result) {
         console.warn("Quét không thành công (AI trả về null).");
         if (!isAuto) alert("Lỗi: Không lấy được tin hoặc API Key sai.");
         setIsScanning(false);
         return;
      }
      // -------------------------------------

      if (!isAuto) {
        alert(`QUÉT THÀNH CÔNG!\nTin: "${result.title}"`);
      }
      onIncidentAdded();
      setLastScanTime(new Date());

    } catch (error) {
      console.log("Lỗi quét:", error);
    } finally {
      setIsScanning(false);
    }
  };

  // --- LOGIC TỰ ĐỘNG HÓA ---
  useEffect(() => {
    if (user && isAdmin) {
      // 1. Quét ngay khi Admin vừa vào
      performScan(true);

      // 2. Cài đặt đồng hồ lặp lại
      scanIntervalRef.current = setInterval(() => {
        performScan(true);
      }, AUTO_SCAN_INTERVAL);

      return () => {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
      };
    }
  }, [user, isAdmin]);


  return (
    <div className="sidebar">

      <div className="admin-panel">
        {user && isAdmin ? (
          <div className="admin-info-container">
            <div className="admin-info">
              <span>Chào Admin: <strong>{user.email}</strong></span>
              <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
            </div>

            {/* NÚT QUÉT THỦ CÔNG (Cho phép Admin bấm bất cứ lúc nào) */}
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
              Lần cuối: {lastScanTime ? lastScanTime.toLocaleTimeString() : 'Chưa quét'}
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