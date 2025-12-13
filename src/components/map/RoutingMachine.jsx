
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix lỗi thiếu icon mặc định của Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const RoutingMachine = ({ userLocation, destination }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !userLocation || !destination) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,

      // 🔥 SỬA LỖI TẠI ĐÂY: Đổi 'vi' thành 'en'
      // Thư viện này chưa hỗ trợ tiếng Việt, dùng 'en' để tránh bị sập web.
      // (Do ta đã ẩn bảng chữ nên người dùng cũng không thấy tiếng Anh đâu)
      language: 'en',

      showAlternatives: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: "#2563eb", weight: 6, opacity: 0.8 }]
      },
      createMarker: function() { return null; },
      containerClassName: 'routing-hidden-container',
      addWaypoints: false,
      draggableWaypoints: false
    }).addTo(map);

    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        console.warn("Lỗi dọn dẹp routing", e);
      }
    };
  }, [map, userLocation, destination]);

  return null;
};

export default RoutingMachine;