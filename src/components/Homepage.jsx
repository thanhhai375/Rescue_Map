import React from 'react';
import { Link } from 'react-router-dom';

function Homepage() {
  return (
    <div className="homepage-container">

      {/* Phần 1: Hero Section - Giữ nguyên nội dung, sẽ style lại bằng CSS */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Hệ Thống Bản Đồ Cứu Hộ</h1>
          <p>
            Kết nối cộng đồng, chia sẻ thông tin cứu trợ khẩn cấp và trực quan hóa
            các điểm nóng thiên tai theo thời gian thực. Chung tay vì một cộng đồng an toàn hơn.
          </p>
          <Link to="/ban-do" className="hero-button">
            Truy Cập Bản Đồ Ngay
          </Link>
        </div>
      </section>

      {/* Phần 2 (Mới): Logo Ý Nghĩa */}
      <section className="info-section logo-meaning-section">
        <div className="info-container">
          <div className="logo-large">
            <i className="fas fa-hand-holding-heart"></i>
          </div>
          <div className="info-content">
            <h2>Ý Nghĩa Logo</h2>
            <p>
              Biểu tượng đôi bàn tay nâng niu trái tim thể hiện tinh thần <strong>tương thân tương ái</strong>,
              sự sẻ chia và đùm bọc của cộng đồng Việt Nam trong những lúc khó khăn, hoạn nạn.
              Màu đỏ tượng trưng cho sự nhiệt huyết và lòng nhân ái.
            </p>
          </div>
        </div>
      </section>

      {/* Phần 3 (Mới): Thông Tin Trang Web */}
      <section className="info-section website-info-section reverse">
        <div className="info-container">
          <div className="info-image">
            {/* Sử dụng một icon hoặc ảnh minh họa phù hợp cho phần này */}
            <img src="https://cdn-icons-png.flaticon.com/512/2921/2921226.png" alt="Thông tin website" />
          </div>
          <div className="info-content">
            <h2>Về Nền Tảng Này</h2>
            <p>
              Website này được xây dựng như một dự án phi lợi nhuận, nhằm cung cấp một công cụ
              trực quan để người dân và các đội cứu hộ có thể:
            </p>
            <ul>
              <li><i className="fas fa-check-circle"></i> Báo cáo các điểm cần cứu trợ khẩn cấp.</li>
              <li><i className="fas fa-check-circle"></i> Định vị và theo dõi các điểm nóng thiên tai trên bản đồ.</li>
              <li><i className="fas fa-check-circle"></i> Kết nối nguồn lực cứu hộ với người cần giúp đỡ một cách nhanh chóng nhất.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Phần 4: Đội ngũ phát triển - Đã cập nhật danh sách */}
      <section className="team-section">
        <h2>Đội Ngũ Phát Triển</h2>
        <p className="team-subtitle">
          Dự án được thực hiện bằng tất cả tâm huyết của các thành viên, với mong muốn
          đóng góp một phần nhỏ bé cho cộng đồng.
        </p>
        <div className="team-cards">
          {/* Thành viên 1 */}
          <div className="team-card">
            {/* Ảnh placeholder, bạn nhớ thay ảnh thật sau này */}
            <div className="team-avatar">
              <span>TH</span>
            </div>
            <h4>Thanh Hải</h4>
            <p className="team-role">Full-stack Developer</p>
          </div>
          {/* Thành viên 2 */}
          <div className="team-card">
            {/* Ảnh placeholder, bạn nhớ thay ảnh thật sau này */}
            <div className="team-avatar">
              <span>TT</span>
            </div>
            <h4>Tấn Triều</h4>
            <p className="team-role">UI/UX Designer</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Homepage;