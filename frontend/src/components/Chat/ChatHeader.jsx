import { History, Menu } from 'lucide-react';

// Trip title, itinerary version picker, the editable API host field, and
// (new) a hamburger button that only renders/shows on narrow screens to
// open the sidebar drawer -- see .mobile-menu-btn in chat.css.
export default function ChatHeader({
  activeTrip,
  tripVersions,
  showVersionDropdown,
  setShowVersionDropdown,
  onRollback,
  formatDate,
  apiUrl,
  setApiUrl,
  onToggleSidebar,
}) {
  return (
    <header className="chat-header glass-panel">
      <div className="chat-header-info">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} title="Toggle trip list" aria-label="Toggle trip list">
          <Menu size={20} />
        </button>

        {activeTrip ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="chat-header-title">
              {activeTrip.title}
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                marginLeft: '8px'
              }}>
                {activeTrip.destination}
              </span>
            </div>

            {/* Direct Version Dropdown Picker */}
            {tripVersions.length > 0 && (
              <div className="version-control-container">
                <button
                  className="version-selector-trigger"
                  onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                >
                  <History size={14} />
                  <span>Version {tripVersions.find(v => v.is_active)?.version || 1} ▾</span>
                </button>
                {showVersionDropdown && (
                  <div className="version-dropdown-menu">
                    {tripVersions.map((v) => (
                      <div
                        key={v.version}
                        className={`version-dropdown-item ${v.is_active ? 'active' : ''}`}
                        onClick={() => onRollback(v.version)}
                      >
                        <div className="version-item-header">
                          <span>Version {v.version}</span>
                          {v.is_active && <span className="active-badge">Active</span>}
                        </div>
                        <div className="version-item-meta">
                          <span>{v.estimated_budget ? `${v.estimated_budget.toLocaleString()} ${v.currency || 'USD'}` : 'No budget'}</span>
                          <span>{formatDate(v.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="chat-header-title">Select or Create a Trip</div>
        )}
      </div>

      <div className="api-url-config">
        <span>API Host:</span>
        <input
          id="api-url-input"
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://localhost:8000"
        />
      </div>
    </header>
  );
}
