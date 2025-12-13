import React from 'react';
import { Link } from 'react-router-dom';
import vietnamMapImg from '../assets/image.png';

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
      <div className="hero-bg"></div>
      <div className="bg-overlay"></div>

      <div className="hero-content-wrapper">
        <div className="giant-title-container">
          <span className="giant-text neon-text">RE</span>
          <VietnamMapS />
          <span className="giant-text neon-text">CUE MAP</span>
        </div>

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