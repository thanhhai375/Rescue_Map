import React from 'react';
import { REGIONS } from '../regionData';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebaseConfig';

// ĐÃ FIX: Xóa 'isAdmin' ra khỏi props vì chưa dùng tới
function Header({ onRegionChange, currentRegionKey, user, onLogin, showAuth = false }) {

  const handleSelectChange = (event) => {
    if (onRegionChange) {
        onRegionChange(event.target.value);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="header">
      <div className="logo-container">
        <Link to="/" className="logo">
          <i className="fas fa-hand-holding-heart"></i>
          <span>Cứu Hộ</span>
        </Link>

        {/* Chỉ hiện Select vùng khi ở trang Map (có hàm onRegionChange) */}
        {onRegionChange && (
            <select
            className="location-select"
            value={currentRegionKey}
            onChange={handleSelectChange}
            >
            {REGIONS.map((region) => (
                <option key={region.key} value={region.key}>
                {region.name}
                </option>
            ))}
            </select>
        )}
      </div>

      <div className="header-nav">
        <div className="desktop-only" style={{display: 'flex', gap: '16px'}}>
            <NavLink to="/" className="nav-link" end>Trang chủ</NavLink>
            <NavLink to="/ban-do" className="nav-link">Bản đồ</NavLink>
            <NavLink to="/lien-he" className="nav-link">Liên hệ</NavLink>
        </div>

        {/* LOGIC: Chỉ hiện nút đăng nhập nếu showAuth = true (Trang chủ) */}
        {showAuth && (
            <div className="auth-actions">
                {user ? (
                    <div className="user-menu">
                        <span className="user-avatar" title={user.email}>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" />
                            ) : (
                                <i className="fas fa-user-circle"></i>
                            )}
                        </span>
                        <button onClick={handleLogout} className="logout-btn-header" title="Đăng xuất">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                ) : (
                    <button onClick={onLogin} className="login-btn-header">
                        <i className="fas fa-user"></i> <span className="desktop-only">Đăng nhập Quản lý</span>
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}


export default Header;