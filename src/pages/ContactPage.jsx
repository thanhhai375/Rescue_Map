import React, { useState } from 'react';
import { getIncidents } from '../config/firebaseConfig';
import { getDistanceFromLatLonInKm } from '../utils/distance';

function ContactPage() {
  const [nearestTeams, setNearestTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Danh sách số khẩn cấp cố định
  const emergencyNumbers = [
    { number: '112', title: 'Tìm kiếm cứu nạn', desc: 'Cứu hộ thiên tai, bão lũ', icon: 'fa-life-ring', color: 'bg-red-500' },
    { number: '115', title: 'Cấp cứu y tế', desc: 'Tai nạn thương tích, sức khỏe', icon: 'fa-user-md', color: 'bg-green-500' },
    { number: '114', title: 'Cứu hỏa / Cứu hộ', desc: 'Hỏa hoạn, mắc kẹt', icon: 'fa-fire-extinguisher', color: 'bg-orange-500' },
    { number: '113', title: 'Cảnh sát', desc: 'An ninh trật tự', icon: 'fa-shield-alt', color: 'bg-blue-500' },
  ];

  // Danh sách từ khóa tìm kiếm nhanh trên Google Maps
  const quickSearchOptions = [
    { label: 'Cứu hộ giao thông', keyword: 'cứu hộ giao thông, xe cứu hộ', icon: 'fa-truck-pickup', color: '#ea580c' }, // Cam đậm
    { label: 'Gara sửa xe', keyword: 'gara sửa xe ô tô xe máy', icon: 'fa-wrench', color: '#4b5563' }, // Xám
    { label: 'Vá lốp lưu động', keyword: 'vá xe lưu động', icon: 'fa-motorcycle', color: '#ca8a04' }, // Vàng đất
    { label: 'Bệnh viện gần nhất', keyword: 'bệnh viện, trạm y tế', icon: 'fa-hospital', color: '#dc2626' }, // Đỏ
    { label: 'Cây xăng', keyword: 'trạm xăng', icon: 'fa-gas-pump', color: '#2563eb' }, // Xanh
    { label: 'Nhà nghỉ/Khách sạn', keyword: 'nhà nghỉ, khách sạn', icon: 'fa-bed', color: '#7c3aed' }, // Tím
  ];

  // 1. Lấy vị trí người dùng
  const handleScanNearby = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userLoc);
        findNearestTeams(userLoc);
      },
      (error) => {
        console.error(error);
        setLocationError("Không thể lấy vị trí. Vui lòng bật GPS và thử lại.");
        setIsLoading(false);
      }
    );
  };

  // 2. Tìm đội cứu hộ trong Database (Cộng đồng)
  const findNearestTeams = async (currentUserLoc) => {
    try {
      const snapshot = await getIncidents('all');
      const teams = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        // Lấy cả 'help' (đội cứu hộ) và 'rescue' (người cần cứu - phòng khi cần tương tác)
        // Nhưng ở trang Liên hệ thì ưu tiên hiển thị Đội cứu hộ ('help')
        if (data.type === 'help' && data.lat && data.lng) {
          const distance = getDistanceFromLatLonInKm(
            currentUserLoc.lat, currentUserLoc.lng,
            data.lat, data.lng
          );

          if (distance <= 50) {
            teams.push({
              id: doc.id,
              ...data,
              distance: distance.toFixed(1)
            });
          }
        }
      });

      teams.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      setNearestTeams(teams);

    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      setLocationError("Có lỗi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Xử lý mở Google Maps tìm dịch vụ
  const handleExternalSearch = (keyword) => {
    if (!userLocation) {
      alert("Vui lòng bấm nút 'Định vị & Quét' trước để lấy vị trí của bạn!");
      return;
    }
    // Tạo link tìm kiếm Google Maps quanh vị trí người dùng
    const url = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${userLocation.lat},${userLocation.lng},14z`;
    window.open(url, '_blank');
  };

  return (
    <div className="contact-page container">
      <div className="contact-content">

        {/* PHẦN 1: SỐ KHẨN CẤP */}
        <section className="emergency-section">
          <h2 className="section-title"><i className="fas fa-phone-volume"></i> Tổng đài Khẩn cấp</h2>
          <div className="emergency-grid">
            {emergencyNumbers.map((item) => (
              <a key={item.number} href={`tel:${item.number}`} className="emergency-card">
                <div className={`emergency-icon ${item.color}`}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div className="emergency-info">
                  <span className="emergency-number">{item.number}</span>
                  <span className="emergency-title">{item.title}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* PHẦN 2: TÌM KIẾM & QUÉT */}
        <section className="nearby-section">
          <div className="nearby-header">
            <h2 className="section-title"><i className="fas fa-search-location"></i> Tìm kiếm Cứu hộ</h2>
            <p>Định vị GPS để tìm đội cứu hộ cộng đồng và các dịch vụ quanh bạn.</p>
          </div>

          <div className="scan-action">
            {!userLocation ? (
              <button className="btn-scan" onClick={handleScanNearby} disabled={isLoading}>
                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crosshairs"></i>}
                {isLoading ? " Đang định vị..." : " Bấm vào đây để Định vị của bạn"}
              </button>
            ) : (
              <div className="location-success">
                <i className="fas fa-check-circle"></i> Vị trí: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </div>
            )}
          </div>

          {locationError && <div className="error-message">{locationError}</div>}

          {/* --- TÍNH NĂNG MỚI: TÌM DỊCH VỤ BÊN NGOÀI (GOOGLE MAPS) --- */}
          {userLocation && (
            <div style={{ marginTop: '30px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#334155' }}>
                <i className="fab fa-google" style={{ color: '#4285F4' }}></i> Tìm dịch vụ quanh đây (Google Maps):
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                {quickSearchOptions.map((opt, index) => (
                  <button
                    key={index}
                    onClick={() => handleExternalSearch(opt.keyword)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px',
                      background: 'white', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)'; }}
                  >
                    <i className={`fas ${opt.icon}`} style={{ fontSize: '24px', marginBottom: '10px', color: opt.color }}></i>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- KẾT QUẢ TỪ DATABASE CỘNG ĐỒNG --- */}
          {userLocation && (
             <>
               <h3 style={{ fontSize: '18px', margin: '20px 0 15px 0', color: '#334155', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                 <i className="fas fa-users" style={{ color: '#10b981' }}></i> Đội cứu hộ cộng đồng (Trong App):
               </h3>

               <div className="team-results">
                {nearestTeams.length === 0 && !isLoading && (
                  <div className="empty-state" style={{ padding: '20px' }}>
                    <p>Chưa có đội cứu hộ tình nguyện nào đăng ký trong bán kính 50km trên hệ thống.</p>
                    <small>Hãy sử dụng tính năng tìm kiếm Google Maps ở trên.</small>
                  </div>
                )}

                {nearestTeams.map(team => (
                  <div key={team.id} className="team-card">
                    <div className="team-distance">
                      <strong>{team.distance}</strong> km
                    </div>
                    <div className="team-details">
                      <h3>{team.title}</h3>
                      <p className="team-address"><i className="fas fa-map-marker-alt"></i> {team.location}</p>
                      <p className="team-desc">{team.description}</p>
                      <div className="team-contact">
                        <a href={`tel:${team.phone}`} className="btn-call">
                          <i className="fas fa-phone"></i> Gọi: {team.phone}
                        </a>
                        <a
                          href={`http://googleusercontent.com/maps.google.com/maps?q=${team.lat},${team.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-direct"
                        >
                          <i className="fas fa-directions"></i> Chỉ đường
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
             </>
          )}

        </section>
      </div>
    </div>
  );
}

export default ContactPage;