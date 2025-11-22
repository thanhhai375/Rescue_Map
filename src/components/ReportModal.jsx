import React, { useState, useEffect } from 'react';
import { addIncident, serverTimestamp } from '../firebaseConfig';

// Dữ liệu form ban đầu (trống)
const initialFormData = {
  type: '',
  title: '',
  description: '',
  sourceLink: '',
  location: '',
  phone: ''
};

function ReportModal({ isOpen, onClose }) {
  // State quản lý dữ liệu gõ vào
  const [formData, setFormData] = useState(initialFormData);
  // State quản lý xem form đã hợp lệ chưa
  const [isFormValid, setIsFormValid] = useState(false);

  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('(Bắt buộc để định vị chính xác trên bản đồ)');
  const [gpsStatusColor, setGpsStatusColor] = useState('#6b7280');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Hàm này được gọi mỗi khi người dùng gõ 1 chữ
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // useEffect này sẽ chạy mỗi khi formData thay đổi
  // Nó kiểm tra xem các trường bắt buộc đã được điền chưa
  useEffect(() => {
    const { type, title, description, location, phone } = formData;
    if (type && title && description && location && phone) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [formData]);


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Trình duyệt của bạn không hỗ trợ lấy GPS.");
      setGpsStatusColor("red");
      return;
    }
    setIsGettingGps(true);
    setGpsStatus("Đang lấy vị trí của bạn, vui lòng đợi...");
    setGpsStatusColor("#f97316");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentCoordinates(coords);
        setGpsStatus(`Đã lấy vị trí: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        setGpsStatusColor("#10b981");
        setIsGettingGps(false);
      },
      (error) => {
        let errorMsg = "Có lỗi xảy ra khi lấy vị trí.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Bạn đã từ chối chia sẻ vị trí. Vui lòng cho phép để tiếp tục.";
        }
        setGpsStatus(errorMsg);
        setGpsStatusColor("red");
        setIsGettingGps(false);
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Kiểm tra lại lần nữa (dù nút đã bị disable)
    if (!isFormValid || !currentCoordinates) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc và lấy vị trí GPS.");
      return;
    }

    setIsSubmitting(true);

    const data = {
      ...formData, // Lấy tất cả dữ liệu từ state
      time: serverTimestamp(),
      lat: currentCoordinates.lat,
      lng: currentCoordinates.lng,
      status: 'pending'
    };

    try {
      await addIncident(data);
      alert('Cảm ơn bạn đã gửi yêu cầu! Yêu cầu của bạn sẽ sớm được quản trị viên xét duyệt.');

      handleClose(); // Gọi hàm đóng và reset

    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu: ", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm này sẽ reset state khi đóng modal
  const handleClose = () => {
    setFormData(initialFormData); // Reset form
    setCurrentCoordinates(null); // Reset GPS
    setIsFormValid(false); // Reset trạng thái valid
    setGpsStatus('(Bắt buộc để định vị chính xác trên bản đồ)');
    setGpsStatusColor('#6b7280');
    onClose(); // Đóng modal
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2><i className="fas fa-bullhorn"></i> Gửi yêu cầu cứu hộ</h2>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {/* Chúng ta dùng onSubmit ở thẻ form */}
          <form id="reportForm" onSubmit={handleSubmit}>

            {/* Mỗi input giờ sẽ có 'name', 'value', và 'onChange' */}
            <div className="form-group">
              <label className="form-label">Loại sự kiện *</label>
              <select
                className="form-select"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Chọn loại</option>
                <option value="rescue">Cần cứu hộ khẩn cấp</option>
                <option value="help">Đội cứu hộ có sẵn</option>
                <option value="warning">Cảnh báo nguy hiểm</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tiêu đề *</label>
              <input
                type="text"
                className="form-input"
                name="title"
                placeholder="VD: Nước ngập cao cần cứu hộ gấp"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả chi tiết *</label>
              <textarea
                className="form-textarea"
                name="description"
                placeholder="Mô tả tình huống..."
                value={formData.description}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Link nguồn</label>
              <input
                type="url"
                className="form-input"
                name="sourceLink"
                placeholder="https://baochi.vn/..."
                value={formData.sourceLink}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vị trí *</label>
              <input
                type="text"
                className="form-input"
                name="location"
                placeholder="Địa chỉ cụ thể (VD: 30 Lê Lợi, phòng 201...)"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tọa độ GPS *</label>
              <button type="button" className="btn btn-secondary" id="getLocationBtn" onClick={handleGetLocation} disabled={isGettingGps}>
                {isGettingGps ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crosshairs"></i>}
                {isGettingGps ? " Đang lấy..." : " Lấy vị trí GPS của tôi"}
              </button>
              <p id="gpsStatus" style={{ fontSize: '12px', color: gpsStatusColor, marginTop: '8px' }}>
                {gpsStatus}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="tel"
                className="form-input"
                name="phone"
                placeholder="0xxxxxxxxx"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Hủy</button>
              {/* NÚT GỬI ĐÃ ĐƯỢC CẬP NHẬT LOGIC DISABLED */}
              <button
                type="submit"
                className="btn btn-primary"
                id="submitBtn"
                disabled={!isFormValid || !currentCoordinates || isSubmitting}
              >
                {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                {isSubmitting ? " Đang gửi..." : " Gửi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;