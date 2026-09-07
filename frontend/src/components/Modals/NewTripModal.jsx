import ModalOverlay from './ModalOverlay';
import './modals.css';

export default function NewTripModal({
  show,
  onClose,
  newTripTitle,
  setNewTripTitle,
  newTripDestination,
  setNewTripDestination,
  onCreate,
}) {
  if (!show) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-header">
        <div className="modal-title">Create New Trip Plan</div>
      </div>

      <form onSubmit={onCreate}>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="new-trip-title">Trip Title</label>
            <input
              id="new-trip-title"
              type="text"
              value={newTripTitle}
              onChange={(e) => setNewTripTitle(e.target.value)}
              placeholder="e.g. Summer Vacation, Weekend getaway"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-trip-destination">Destination City</label>
            <input
              id="new-trip-destination"
              type="text"
              value={newTripDestination}
              onChange={(e) => setNewTripDestination(e.target.value)}
              placeholder="e.g. Paris, London, NYC"
              required
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            id="btn-cancel-new-trip"
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="btn-submit-new-trip"
            type="submit"
            className="btn btn-primary"
          >
            Create Trip
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
