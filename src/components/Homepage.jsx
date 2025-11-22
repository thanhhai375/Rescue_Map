import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

function Homepage() {
  return (
    <div className="homepage-container">

      {/* Phần 1: Hero Section (Màu xanh) */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Thông Tin Cứu Hộ</h1>
          <p>
            Dự án cộng đồng nhằm thu thập và trực quan hóa thông tin liên quan đến cứu trợ,
            cứu nạn trong các trận thiên tai. Chúng tôi mong muốn mang đến cho cộng đồng
            một cái nhìn trực quan và kịp thời tại các vùng chịu ảnh hưởng bởi thiên tai.
          </p>
          {/* Nút này sẽ dẫn đến trang bản đồ */}
          <Link to="/ban-do" className="hero-button">
            Xem Bản Đồ
          </Link>
        </div>
      </section>

      {/* Phần 2: Đội ngũ phát triển (Giống ảnh) */}
      <section className="team-section">
        <h2>Ghi nhận đóng góp</h2>
        <p className="team-subtitle">
          Chúng tôi xin gửi lời cảm ơn sâu sắc đến những cá nhân và tổ chức đã cùng chung tay xây dựng
          và hỗ trợ việc vận hành nền tảng này.
        </p>
        <h3>Đội ngũ phát triển</h3>
        <div className="team-cards">
          <div className="team-card">
            <img src="https://via.placeholder.com/100" alt="Tất Huân" />
            <h4>Tất Huân</h4>
          </div>
          <div className="team-card">
            <img src="https://via.placeholder.com/100" alt="Long Đặng" />
            <h4>Long Đặng</h4>
          </div>
          <div className="team-card">
            <img src="https://via.placeholder.com/100" alt="Mai Anh" />
            <h4>Mai Anh</h4>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Homepage;