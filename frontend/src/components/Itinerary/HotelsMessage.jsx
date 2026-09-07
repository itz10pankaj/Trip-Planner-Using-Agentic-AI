import { Hotel, MapPin, Star } from 'lucide-react';
import './itinerary.css';

export default function HotelsMessage({ hotelsData, activeTrip }) {
  const hotelList = Array.isArray(hotelsData) ? hotelsData : (hotelsData.data || []);

  return (
    <div className="message hotels animate-fade-in">
      <div className="avatar">🏨</div>
      <div className="message-content hotels-card-wrapper">
        <span className="sender-name">Agent (Hotel Recommendations)</span>
        <div className="hotels-grid">
          {hotelList.map((hotel, hIdx) => (
            <div key={hIdx} className="hotel-item">
              <div className="hotel-img-placeholder">
                <Hotel size={32} />
              </div>
              <div className="hotel-info">
                <div className="hotel-name">{hotel.name}</div>
                <div className="hotel-address">
                  <MapPin size={11} />
                  <span>{hotel.distance ? `${hotel.distance} ${hotel.distanceUnit || 'KM'} from center` : 'Centrally located'}</span>
                </div>
                <div className="hotel-desc">
                  Coordinates: {hotel.latitude?.toFixed(4)}, {hotel.longitude?.toFixed(4)}
                </div>
                <div className="hotel-rating-price">
                  <span className="hotel-rating">
                    <Star size={12} fill="#eab308" color="#eab308" />
                    4.2
                  </span>
                  <span style={{ color: 'var(--accent-primary)' }}>{activeTrip?.destination || 'PAR'} Stay</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
