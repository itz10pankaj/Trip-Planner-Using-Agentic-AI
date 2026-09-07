import { MapPin } from 'lucide-react';

export default function TripListItem({ trip, active, onClick, formatDate }) {
  return (
    <div
      id={`trip-card-${trip.trip_id}`}
      className={`trip-card ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="trip-title">{trip.title || 'Untitled Trip'}</div>
      <div className="trip-destination">
        <MapPin size={13} style={{ color: 'var(--accent-secondary)' }} />
        {trip.destination || 'Anywhere'}
      </div>
      <div className="trip-footer">
        <span className="trip-date">{formatDate(trip.created_at)}</span>
        <span className="trip-status">{trip.status}</span>
      </div>
    </div>
  );
}
