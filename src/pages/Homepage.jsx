import React from 'react';
import { Link } from 'react-router-dom';
// Import hình ảnh bản đồ
import vietnamMapImg from '../assets/image.png'; // Đảm bảo đường dẫn đúng

// Component Bản đồ Việt Nam 3D (Dùng hình ảnh PNG)
const VietnamMapS = () => (
  <div className="map-s-container">
    <img
      src={vietnamMapImg}
      alt="Bản đồ Việt Nam 3D"
      className="vietnam-map-image"
    />
  </div>
);

function Homepage() {
  return (
    <div className="homepage-hero-fullscreen">
      {/* Background Gradient & Overlay */}
      <div className="hero-bg"></div>
      <div className="bg-overlay"></div>

      <div className="hero-content-wrapper">
        {/* Chữ to RESCUE MAP với chữ S là bản đồ */}
        <div className="giant-title-container">
          <span className="giant-text neon-text">RE</span>
          <VietnamMapS />
          <span className="giant-text neon-text">CUE MAP</span>
        </div>

        {/* Nút bấm */}
        <div className="cta-container">
            <Link to="/ban-do" className="glass-btn-3d float-btn">
              Truy Cập Bản Đồ
            </Link>
        </div>
      </div>
    </div>
  );
}

export default Homepage;