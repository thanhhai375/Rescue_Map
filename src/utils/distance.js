// Hàm tính khoảng cách giữa 2 điểm (lat, lng)
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái đất (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Khoảng cách (km)
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export const distanceFilterToKm = (filter) => {
  if (filter === '>100km') return Infinity;
  const km = parseInt(filter.replace('km', ''));
  if (isNaN(km)) return Infinity;
  return km;
};