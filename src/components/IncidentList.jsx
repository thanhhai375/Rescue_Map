import React from 'react';
import IncidentCard from './IncidentCard';

function IncidentList({
  incidents,
  onIncidentAdded,
  isAdmin,
  handleLogin,
  currentFilter,
  onCardClick,
  onEditIncident // Nhận prop này
}) {

  const filteredIncidents = incidents.filter(incident => {
    if (currentFilter === 'all') return true;
    return incident.type === currentFilter;
  });

  return (
    <div className="incident-list">
      {filteredIncidents.length === 0 ? (
        <p style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
          Không có dữ liệu cho bộ lọc này.
        </p>
      ) : (
        filteredIncidents.map(incident => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onStatusUpdate={onIncidentAdded}
            isAdmin={isAdmin}
            handleLogin={handleLogin}
            onCardClick={onCardClick}
            onEditIncident={onEditIncident} // Truyền tiếp xuống Card
          />
        ))
      )}
    </div>
  );
}


export default IncidentList;