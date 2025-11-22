import React, { useState, useEffect } from 'react';
import { addIncident, updateIncident, serverTimestamp } from '../firebaseConfig';

// Dữ liệu form ban đầu (trống)
const initialFormData = {
  type: '',
  title: '',
  description: '',
  sourceLink: '',
  location: '',
  phone: ''
};

function ReportModal({ isOpen, onClose, incidentToEdit }) {
  // State quản lý dữ liệu gõ vào
  const [formData, setFormData] = useState(initialFormData);
  const [isFormValid, setIsFormValid] = useState(false);

  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('(Bắt buộc để định vị chính xác trên bản đồ)');
  const [gpsStatusColor, setGpsStatusColor] = useState('#6b7280');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false); // State mới cho tìm tọa độ từ địa chỉ

  // --- LOGIC EDIT: Điền dữ liệu cũ vào form khi mở chế độ sửa ---
  useEffect(() => {
    if (incidentToEdit) {
      setFormData({
        type: incidentToEdit.type || '',
        title: incidentToEdit.title || '',
        description: incidentToEdit.description || '',
        sourceLink: incidentToEdit.sourceLink || '',
        location: incidentToEdit.location || '',
        phone: incidentToEdit.phone || ''
      });
      if (incidentToEdit.lat && incidentToEdit.lng) {
        setCurrentCoordinates({ lat: incidentToEdit.lat, lng: incidentToEdit.lng });
        setGpsStatus(`Tọa độ hiện tại: ${incidentToEdit.lat.toFixed(6)}, ${incidentToEdit.lng.toFixed(6)}`);
        setGpsStatusColor("#10b981");
      }
    } else {
      // Nếu không phải edit (tức là thêm mới), reset form
      setFormData(initialFormData);
      setCurrentCoordinates(null);
      setGpsStatus('(Bắt buộc để định vị chính xác trên bản đồ)');
      setGpsStatusColor('#6b7280');
    }
  }, [incidentToEdit, isOpen]);

  // Validate form
  useEffect(() => {
    const { type, title, description, location, phone } = formData;
    if (type && title && description && location && phone) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // --- TÍNH NĂNG 1: TỰ ĐỘNG TÌM TỌA ĐỘ TỪ ĐỊA CHỈ (Geocoding) ---
  const handleBlurLocation = async () => {
    // Nếu ô địa chỉ trống, không làm gì cả
    if (!formData.location) return;

    // Nếu đã có tọa độ rồi thì thôi, không tìm lại để tránh ghi đè (trừ khi người dùng xóa tọa độ thủ công - logic nâng cao)
    // Tuy nhiên, nếu người dùng sửa địa chỉ, họ có thể muốn tìm lại tọa độ.
    // Ở đây ta tạm thời ưu tiên: Nếu đã có coords thì không auto-fetch lại để tránh mất GPS chính xác.
    if (currentCoordinates) return;

    setIsGeocoding(true);
    setGpsStatus("Đang tìm tọa độ từ địa chỉ...");
    setGpsStatusColor("#f97316");

    try {
      // Sử dụng API miễn phí của OpenStreetMap (Nominatim)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&countrycodes=vn&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCurrentCoordinates({ lat, lng });
        setGpsStatus(`Đã tìm thấy tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setGpsStatusColor("#10b981");
      } else {
        setGpsStatus("Không tìm thấy tọa độ cho địa chỉ này. Vui lòng nhập thủ công hoặc lấy GPS.");
        setGpsStatusColor("red");
      }
    } catch (error) {
      console.error("Lỗi Geocoding:", error);
      setGpsStatus("Lỗi khi tìm tọa độ tự động.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // --- TÍNH NĂNG 2: LẤY GPS VÀ TỰ ĐIỀN ĐỊA CHỈ (Reverse Geocoding) ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Trình duyệt của bạn không hỗ trợ lấy GPS.");
      setGpsStatusColor("red");
      return;
    }
    setIsGettingGps(true);
    setGpsStatus("Đang lấy vị trí của bạn...");
    setGpsStatusColor("#f97316");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentCoordinates(coords);
        setGpsStatus(`Đã lấy vị trí: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        setGpsStatusColor("#10b981");

        // Gọi API để lấy địa chỉ từ tọa độ
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                // Tự động điền vào ô địa chỉ nếu ô đó đang trống
                if (!formData.location) {
                    setFormData(prev => ({ ...prev, location: data.display_name }));
                }
            }
        } catch (err) {
            console.log("Không lấy được tên đường:", err);
        }

        setIsGettingGps(false);
      },
      (error) => {
        let errorMsg = "Có lỗi xảy ra khi lấy vị trí.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Bạn đã từ chối chia sẻ vị trí.";
        }
        setGpsStatus(errorMsg);
        setGpsStatusColor("red");
        setIsGettingGps(false);
      }
    );
  };

  // Hàm reset tọa độ để người dùng chọn lại (nếu muốn)
  const handleResetCoordinates = () => {
    setCurrentCoordinates(null);
    setGpsStatus('(Bắt buộc để định vị chính xác trên bản đồ)');
    setGpsStatusColor('#6b7280');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid || !currentCoordinates) {
      alert("Vui lòng điền đầy đủ thông tin và lấy vị trí GPS.");
      return;
    }

    setIsSubmitting(true);

    const data = {
      ...formData,
      lat: currentCoordinates.lat,
      lng: currentCoordinates.lng,
      status: incidentToEdit ? incidentToEdit.status : 'pending',
      time: incidentToEdit ? incidentToEdit.time : serverTimestamp()
    };

    try {
      if (incidentToEdit) {
        await updateIncident(incidentToEdit.id, data);
        alert('Cập nhật thông tin thành công!');
      } else {
        await addIncident(data);
        alert('Cảm ơn bạn đã gửi yêu cầu! Đang chờ duyệt.');
      }
      handleClose();
    } catch (error) {
      console.error("Lỗi khi gửi form:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
              <i className={incidentToEdit ? "fas fa-edit" : "fas fa-bullhorn"}></i>
              {incidentToEdit ? " Chỉnh sửa thông tin" : " Gửi yêu cầu cứu hộ"}
          </h2>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <form id="reportForm" onSubmit={handleSubmit}>

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
                placeholder="https://..."
                value={formData.sourceLink}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vị trí (Địa chỉ) *</label>
              <div style={{display: 'flex', gap: '10px'}}>
                  <input
                    type="text"
                    className="form-input"
                    name="location"
                    placeholder="Nhập địa chỉ cụ thể (Hệ thống sẽ tự tìm tọa độ)"
                    value={formData.location}
                    onChange={handleInputChange}
                    onBlur={handleBlurLocation}
                    required
                  />
                  <button type="button" className="btn btn-secondary" style={{width: '50px'}} onClick={handleBlurLocation} title="Tìm tọa độ từ địa chỉ">
                    <i className="fas fa-search-location"></i>
                  </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tọa độ GPS *</label>

              {/* --- LOGIC MỚI: CHỈ HIỆN NÚT KHI CHƯA CÓ TỌA ĐỘ --- */}
              {!currentCoordinates && (
                <button type="button" className="btn btn-secondary" onClick={handleGetLocation} disabled={isGettingGps}>
                  {isGettingGps ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crosshairs"></i>}
                  {isGettingGps ? " Đang lấy..." : " Lấy vị trí GPS của tôi"}
                </button>
              )}

              {/* Nếu đã có tọa độ, hiển thị nút Reset nhỏ (tùy chọn, để lỡ tìm sai còn sửa lại được) */}
              {currentCoordinates && (
                 <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
                    <span style={{color: '#15803d', fontWeight: '500', fontSize: '13px'}}>
                       <i className="fas fa-check-circle"></i> Đã xác định tọa độ
                    </span>
                    <button type="button" onClick={handleResetCoordinates} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline'}}>
                       Chọn lại
                    </button>
                 </div>
              )}

              <p style={{ fontSize: '12px', color: gpsStatusColor, marginTop: '8px', fontWeight: '500' }}>
                {isGeocoding ? <><i className="fas fa-spinner fa-spin"></i> Đang tìm tọa độ...</> : gpsStatus}
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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isFormValid || !currentCoordinates || isSubmitting}
              >
                {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                {isSubmitting ? " Đang lưu..." : (incidentToEdit ? " Cập nhật" : " Gửi")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;