import { Compass, Settings, LogOut, Plus } from 'lucide-react';
import Spinner from '../Common/Spinner';
import TripListItem from './TripListItem';
import './sidebar.css';

// Left navigation: brand header, account card, quick actions, and the trip
// list. `mobileOpen` only matters below the responsive breakpoint (see
// sidebar.css) -- above it the sidebar is always visible, matching the
// original fixed layout exactly.
export default function Sidebar({
  currentUser,
  subscription,
  trips,
  tripsLoading,
  activeTripId,
  setActiveTripId,
  formatDate,
  onOpenPreferences,
  onOpenNewTrip,
  onOpenSubscription,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <aside className={`sidebar glass-panel ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Compass className="logo-icon" size={26} />
          <h1 className="logo-text">AI Trip Planner</h1>
        </div>

        <div className="user-account-display" onClick={onOpenSubscription} style={{ cursor: 'pointer' }}>
          <div className="user-account-info">
            <div className="user-avatar-circle">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="user-name-text">{currentUser.username}</span>
              <span className={`user-subs-badge ${subscription?.active_tier || 'free'}`}>
                {(subscription?.active_tier || 'free').toUpperCase()} PLAN
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="logout-icon-btn" onClick={(e) => { e.stopPropagation(); onOpenSubscription(); }} title="Subscription Settings">
              <Settings size={16} />
            </button>
            <button className="logout-icon-btn" onClick={(e) => { e.stopPropagation(); onLogout(); }} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="sidebar-actions">
        <button
          id="btn-preferences"
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={onOpenPreferences}
        >
          <Settings size={15} />
          Prefs
        </button>

        <button
          id="btn-new-trip"
          className="btn btn-primary"
          style={{ flex: 1.5 }}
          onClick={onOpenNewTrip}
        >
          <Plus size={15} />
          New Trip
        </button>
      </div>

      <div className="trips-container">
        <div className="section-title">Your Trips</div>
        {tripsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spinner size={24} style={{ color: 'var(--accent-primary)' }} />
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>
            No trips yet. Create one to get started!
          </div>
        ) : (
          trips.map((trip) => (
            <TripListItem
              key={trip.trip_id}
              trip={trip}
              active={activeTripId === trip.trip_id}
              onClick={() => {
                setActiveTripId(trip.trip_id);
                onCloseMobile?.();
              }}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </aside>
  );
}
