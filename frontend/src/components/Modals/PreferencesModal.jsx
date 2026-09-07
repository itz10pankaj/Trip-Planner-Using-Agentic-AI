import ModalOverlay from './ModalOverlay';
import './modals.css';

export default function PreferencesModal({ show, onClose, preferences, setPreferences, onSave }) {
  if (!show) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <div className="modal-title">Travel Preferences</div>
      </div>

      <form onSubmit={onSave}>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="travel-style">Travel Style</label>
            <select
              id="travel-style"
              value={preferences.travel_style || 'Relaxing'}
              onChange={(e) => setPreferences({ ...preferences, travel_style: e.target.value })}
            >
              <option value="Relaxing">Relaxing</option>
              <option value="Adventure">Adventure</option>
              <option value="Cultural">Cultural</option>
              <option value="Shopping">Shopping</option>
              <option value="Historical">Historical</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="budget-range">Budget Range</label>
            <select
              id="budget-range"
              value={preferences.budget_range || 'Mid-Range'}
              onChange={(e) => setPreferences({ ...preferences, budget_range: e.target.value })}
            >
              <option value="Economy">Economy</option>
              <option value="Mid-Range">Mid-Range</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preferred-climate">Preferred Climate</label>
            <select
              id="preferred-climate"
              value={preferences.preferred_climate || 'Warm'}
              onChange={(e) => setPreferences({ ...preferences, preferred_climate: e.target.value })}
            >
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
              <option value="Tropical">Tropical</option>
              <option value="Any">Any</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="food-preference">Food Preference</label>
            <select
              id="food-preference"
              value={preferences.food_preference || 'Any'}
              onChange={(e) => setPreferences({ ...preferences, food_preference: e.target.value })}
            >
              <option value="Any">Any</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Halal">Halal</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="accommodation-type">Accommodation Type</label>
            <select
              id="accommodation-type"
              value={preferences.accommodation_type || 'Hotel'}
              onChange={(e) => setPreferences({ ...preferences, accommodation_type: e.target.value })}
            >
              <option value="Hotel">Hotel</option>
              <option value="Hostel">Hostel</option>
              <option value="Resort">Resort</option>
              <option value="Apartment">Apartment</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pace">Pace</label>
            <select
              id="pace"
              value={preferences.pace || 'Medium'}
              onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
            >
              <option value="Slow">Slow</option>
              <option value="Medium">Medium</option>
              <option value="Fast">Fast</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            id="btn-cancel-prefs"
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="btn-save-prefs"
            type="submit"
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
