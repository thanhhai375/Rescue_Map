import React from 'react';
import IncidentList from './IncidentList';
import { auth } from '../firebaseConfig';

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
  onCardClick // Nhận prop
}) {

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="sidebar">

      <div className="admin-panel">
        {user && isAdmin ? (
          <div className="admin-info">
            <span>Chào Admin: <strong>{user.email}</strong></span>
            <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
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
        onCardClick={onCardClick} // Truyền prop xuống
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