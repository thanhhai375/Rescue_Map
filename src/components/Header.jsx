import React from 'react';
import { REGIONS } from '../regionData';
import { Link, NavLink } from 'react-router-dom'; // Import Link và NavLink

function Header({ onRegionChange, currentRegionKey }) {

  const handleSelectChange = (event) => {
    onRegionChange(event.target.value);
  };

  return (
    <div className="header">
      <div className="logo-container">
        {/* Logo giờ cũng là một Link về trang chủ */}
        <Link to="/" className="logo">
          <i className="fas fa-hand-holding-heart"></i>
          <span>Cứu Hộ</span>
        </Link>

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

      </div>
      <div className="header-nav">
        {/* Dùng NavLink để tự động có class 'active' */}
        <NavLink to="/" className="nav-link" end>Trang chủ</NavLink>
        <NavLink to="/ban-do" className="nav-link">Bản đồ</NavLink>
        <NavLink to="/lien-he" className="nav-link">Liên hệ</NavLink>
      </div>
    </div>
  );
}

export default Header;