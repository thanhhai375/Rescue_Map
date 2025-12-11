import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { auth, onAuthStateChanged, getIncidents, handleGoogleLogin, getAllIncidentsForAdmin, deleteOldIncidents } from './config/firebaseConfig'; // Config
import { REGIONS } from './constants/regionData'; // Constants
import Header from './components/layout/Header'; // Layout
import ReportModal from './components/incident/ReportModal'; // Incident
import FilterModal from './components/map/FilterModal'; // Map
import { distanceFilterToKm, getDistanceFromLatLonInKm } from './utils/distance';

const ADMIN_EMAILS = [
  "thanhhai30072005@gmail.com",
];

const timeFilterToMs = (filter) => {
  if (filter === 'all') return Infinity;
  const hours = parseInt(filter.replace('h', ''));
  if (isNaN(hours)) return Infinity;
  return hours * 60 * 60 * 1000;
};

function App() {
  const [incidents, setIncidents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRegionKey, setCurrentRegionKey] = useState('vietnam');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('>100km');
  const [hidePOIs, setHidePOIs] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const location = useLocation();

  // Xác định trang hiện tại
  const isMapPage = location.pathname === '/ban-do';
  const isHomePage = location.pathname === '/';

  const handleEditIncident = (incident) => {
    setEditingIncident(incident);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingIncident(null);
  };

  useEffect(() => {
    const cleanUp = async () => {
        await deleteOldIncidents();
    };
    cleanUp();
  }, []);

  const loadData = async (isAdminUser) => {
    // Chỉ tải dữ liệu khi ở trang bản đồ để tiết kiệm tài nguyên
    if (!isMapPage) {
      setIncidents([]);
      return;
    }
    try {
      let querySnapshot;
      if (isAdminUser) {
        querySnapshot = await getAllIncidentsForAdmin();
      } else {
        let hours;
        if (timeFilter === 'all') {
          hours = 'all';
        } else {
          hours = parseInt(timeFilter.replace('h', '')) || 48;
        }
        querySnapshot = await getIncidents(hours);
      }

      const incidentsData = [];
      querySnapshot.forEach((doc) => {
        incidentsData.push({ id: doc.id, ...doc.data() });
      });

      if (isAdminUser) {
        incidentsData.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return (b.time ? b.time.seconds : 0) - (a.time ? a.time.seconds : 0);
        });
      } else {
        incidentsData.sort((a, b) => (b.time ? b.time.seconds : 0) - (a.time ? a.time.seconds : 0));
      }
      setIncidents(incidentsData);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  };

  useEffect(() => {
    loadData(isAdmin);
  }, [isAdmin, location.pathname, timeFilter]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDataChange = () => {
    loadData(isAdmin);
  };

  const triggerLogin = async () => {
    try {
      await handleGoogleLogin();
    } catch (error) {
      console.error("Lỗi khi đăng nhập Google:", error);
      let msg = "Đăng nhập thất bại.";
      if (error.code === 'auth/popup-closed-by-user') {
        msg = "Bạn đã đóng cửa sổ đăng nhập.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        msg = "Xung đột nhiều popup. Vui lòng thử lại.";
      } else if (error.code === 'auth/unauthorized-domain') {
        msg = "LỖI CẤU HÌNH: Tên miền này chưa được phép dùng Firebase Auth.";
      } else {
        msg = `Lỗi: ${error.message}`;
      }
      alert(msg);
    }
  };

  const handleRegionChange = (regionKey) => {
    setCurrentRegionKey(regionKey);
  };

  const handleGetUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        alert("Trình duyệt của bạn không hỗ trợ lấy GPS.");
        reject(new Error("No geolocation support"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handleDistanceFilterChange = async (distanceKey) => {
    setDistanceFilter(distanceKey);
    if (!userLocation && distanceKey !== '>100km') {
      try {
        await handleGetUserLocation();
      } catch {
        setDistanceFilter('>100km');
      }
    }
  };

const incidentCounts = useMemo(() => {
    const approvedIncidents = incidents.filter(i => i.status !== 'pending');
    return {
      all: approvedIncidents.length,
      rescue: approvedIncidents.filter(i => i.type === 'rescue').length,
      supply: approvedIncidents.filter(i => i.type === 'supply').length, // <--- THÊM DÒNG NÀY
      help: approvedIncidents.filter(i => i.type === 'help').length,
      warning: approvedIncidents.filter(i => i.type === 'warning').length,
      news: approvedIncidents.filter(i => i.type === 'news').length,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const now = new Date().getTime();
    const timeLimitMs = timeFilterToMs(timeFilter);
    const distanceLimitKm = distanceFilterToKm(distanceFilter);

    return incidents.filter(incident => {
      const matchesSearch =
        incident.title.toLowerCase().includes(query) ||
        incident.location.toLowerCase().includes(query) ||
        (incident.phone && incident.phone.includes(query));
      if (!matchesSearch) return false;

      const matchesFilter = (currentFilter === 'all') || (incident.type === currentFilter);
      if (!matchesFilter) return false;

      if (!isAdmin && incident.status === 'pending') {
        return false;
      }

      if (incident.time && incident.time.seconds) {
        const incidentTimeMs = incident.time.seconds * 1000;
        const ageMs = now - incidentTimeMs;
        if (ageMs > timeLimitMs) return false;
      } else {
        return false;
      }

      if (distanceLimitKm !== Infinity) {
        if (!userLocation) return false;
        if (!incident.lat || !incident.lng) return false;
        const distance = getDistanceFromLatLonInKm(
          userLocation.lat, userLocation.lng,
          incident.lat, incident.lng
        );
        if (distance > distanceLimitKm) return false;
      }

      return true;
    });
  }, [incidents, currentFilter, searchQuery, isAdmin, timeFilter, distanceFilter, userLocation]);


  const outletContext = {
    incidents: filteredIncidents,
    onOpenModal: () => setIsModalOpen(true),
    onOpenFilterModal: () => setIsFilterModalOpen(true),
    onIncidentAdded: handleDataChange,
    user,
    isAdmin,
    handleLogin: triggerLogin,
    currentRegion: REGIONS.find(r => r.key === currentRegionKey) || REGIONS[0],

    currentFilter,
    onFilterChange: setCurrentFilter,
    incidentCounts,

    searchQuery,
    onSearchChange: setSearchQuery,

    timeFilter,
    onTimeFilterChange: setTimeFilter,
    distanceFilter,
    onDistanceFilterChange: handleDistanceFilterChange,
    hidePOIs,
    onHidePOIsChange: setHidePOIs,
    onEditIncident: handleEditIncident
  };

  return (
    <>
      <Header
        // Chỉ truyền hàm đổi vùng khi ở trang bản đồ
        onRegionChange={isMapPage ? handleRegionChange : null}
        currentRegionKey={currentRegionKey}

        user={user}
        isAdmin={isAdmin}
        onLogin={triggerLogin}

        // LOGIC MỚI: Chỉ hiện nút đăng nhập ở trang chủ (isHomePage)
        showAuth={isHomePage}
      />

      <Outlet context={outletContext} />

      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        incidentToEdit={editingIncident}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        distanceFilter={distanceFilter}
        onDistanceFilterChange={handleDistanceFilterChange}
        hidePOIs={hidePOIs}
        onHidePOIsChange={setHidePOIs}
      />
    </>
  );
}


export default App;