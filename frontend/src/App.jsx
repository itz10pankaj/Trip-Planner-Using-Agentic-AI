import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  MapPin,
  Send,
  Plus,
  Settings,
  RefreshCw,
  Thermometer,
  DollarSign,
  Hotel,
  Check,
  Compass,
  User,
  Navigation,
  Loader,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Star,
  LogOut,
  Lock,
  Mail
} from 'lucide-react';
import './App.css';

// TypewriterText component to render text word-by-word
function TypewriterText({ text, speed = 15, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) return;
    const words = text.split(' ');
    let index = 0;
    setDisplayedText('');

    const timer = setInterval(() => {
      if (index < words.length) {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[index]);
        index++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}

function App() {
  // App Config States
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [userId, setUserId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Auth Form States
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App Data States
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [tripVersions, setTripVersions] = useState([]);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  // Modals & Forms
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');

  // Preferences State
  const [preferences, setPreferences] = useState({
    travel_style: 'Relaxing',
    budget_range: 'Mid-Range',
    preferred_climate: 'Warm',
    food_preference: 'Any',
    accommodation_type: 'Hotel',
    pace: 'Medium'
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [activeDayTabs, setActiveDayTabs] = useState({});
  const [expandedTools, setExpandedTools] = useState({});
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);

  // Trigger Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Check localStorage for session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('trip_planner_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setUserId(parsed.user_id);
      } catch (err) {
        console.error('Failed to parse saved user', err);
      }
    }
  }, []);

  // Load Trips & Preferences when User ID changes
  useEffect(() => {
    if (userId) {
      fetchTrips();
      fetchPreferences();
    }
  }, [userId, apiUrl]);

  // Fetch Versions when activeTripId changes
  useEffect(() => {
    if (activeTripId) {
      fetchVersions(activeTripId);
    } else {
      setTripVersions([]);
    }
  }, [activeTripId, apiUrl]);

  // Fetch Trips
  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/trips`, {
        headers: { 'x_user_id': userId }
      });
      const data = await res.json();
      if (data && data.trips) {
        setTrips(data.trips);
        if (data.trips.length > 0 && !activeTripId) {
          setActiveTripId(data.trips[0].trip_id);
        }
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch trips. Is backend running?', 'error');
    } finally {
      setTripsLoading(false);
    }
  };

  // Fetch Preferences
  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${apiUrl}/preferences`, {
        headers: { 'x_user_id': userId }
      });
      const data = await res.json();
      if (data && data.status === 'success' && data.data) {
        setPreferences(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Itinerary Versions
  const fetchVersions = async (tripId) => {
    try {
      const res = await fetch(`${apiUrl}/history/${tripId}/versions`);
      const data = await res.json();
      if (data && data.status === 'success') {
        setTripVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Failed to fetch versions', err);
    }
  };

  // Fetch History for selected Trip
  useEffect(() => {
    if (activeTripId) {
      fetchHistory(activeTripId);
    } else {
      setMessages([]);
    }
  }, [activeTripId, apiUrl]);

  const fetchHistory = async (tripId) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/history/${tripId}`);
      const data = await res.json();
      if (data && data.status === 'success') {
        // Tag history messages as already typed (not new)
        const historyMsgs = (data.messages || []).map(msg => ({
          ...msg,
          isNew: false
        }));
        setMessages(historyMsgs);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      setMessages([]);
      showToast('Could not load chat history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Authentication submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setAuthLoading(true);
    const endpoint = authTab === 'login' ? 'login' : 'register';
    try {
      const res = await fetch(`${apiUrl}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (authTab === 'register') {
          showToast('Registration successful! Logging you in...');
          // Auto login after registration
          const loginRes = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: authUsername, password: authPassword })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.status === 'success') {
            completeLogin(loginData);
          }
        } else {
          completeLogin(data);
        }
      } else {
        showToast(data.detail || 'Authentication failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to authentication server.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const completeLogin = (loginData) => {
    const userObj = { username: loginData.username, user_id: loginData.user_id };
    setCurrentUser(userObj);
    setUserId(loginData.user_id);
    localStorage.setItem('trip_planner_user', JSON.stringify(userObj));
    showToast(`Logged in as ${loginData.username} 🎉`);
    setAuthUsername('');
    setAuthPassword('');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setUserId('');
    localStorage.removeItem('trip_planner_user');
    setTrips([]);
    setActiveTripId(null);
    setMessages([]);
    setTripVersions([]);
    showToast('Logged out successfully.');
  };

  // Save Preferences
  const savePreferences = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x_user_id': userId
        },
        body: JSON.stringify(preferences)
      });
      const data = await res.json();
      if (data && data.status === 'success') {
        showToast('Preferences updated successfully!');
        setShowPreferencesModal(false);
      } else {
        showToast(data.message || 'Error updating preferences.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend.', 'error');
    }
  };

  // Create Trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripTitle || !newTripDestination) {
      showToast('Please fill all fields', 'error');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x_user_id': userId
        },
        body: JSON.stringify({
          title: newTripTitle,
          destination: newTripDestination
        })
      });
      const data = await res.json();
      if (data && data.status === 'success') {
        showToast('Trip created successfully!');
        setNewTripTitle('');
        setNewTripDestination('');
        setShowNewTripModal(false);
        await fetchTrips();
        setActiveTripId(data.trip_id);
      } else {
        showToast(data.message || 'Failed to create trip.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not create trip.', 'error');
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const query = textOverride || userInput;
    if (!query.trim() || !activeTripId) return;

    if (!textOverride) {
      setUserInput('');
    }

    // Add user message to UI
    const newUserMsg = { type: 'human', content: query, isNew: false };
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const res = await fetch(
        `${apiUrl}/trips/${activeTripId}/chat?question=${encodeURIComponent(query)}`,
        {
          headers: { 'x_user_id': userId }
        }
      );
      const data = await res.json();

      if (data && data.status === 'success') {
        if (data.type === 'trip_plan') {
          setMessages(prev => [...prev, {
            type: 'trip_plan',
            content: data.data,
            isNew: true
          }]);
          showToast('Itinerary plan loaded! 🗺️');
        } else if (data.type === 'hotels') {
          setMessages(prev => [...prev, {
            type: 'hotels',
            content: data.data,
            isNew: true
          }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'ai',
            content: data.answer,
            isNew: true // Trigger word-by-word animation
          }]);
        }
        // Refresh sidebar and version list
        fetchTrips();
        fetchVersions(activeTripId);
      } else {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: data.message || 'Error occurred.',
          isNew: true
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Failed to communicate with agent. Ensure server is running.',
        isNew: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Directly Rollback/Migrate to a specific version via API
  const handleRollback = async (versionNum) => {
    setLoading(true);
    setShowVersionDropdown(false);
    try {
      const res = await fetch(`${apiUrl}/history/${activeTripId}/rollback/${versionNum}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data && data.status === 'success') {
        showToast(`Migrated successfully to Version ${versionNum}!`);
        await fetchHistory(activeTripId);
        await fetchVersions(activeTripId);
      } else {
        showToast(data.message || 'Failed to rollback version.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to backend for rollback.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to change active tab of itinerary
  const setDayTab = (messageIndex, dayNum) => {
    setActiveDayTabs(prev => ({
      ...prev,
      [messageIndex]: dayNum
    }));
  };

  // Toggle tool call JSON visibility
  const toggleToolView = (toolIndex) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolIndex]: !prev[toolIndex]
    }));
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeTrip = trips.find(t => t.trip_id === activeTripId);

  // Render Login / Registration panel if not authenticated
  if (!currentUser) {
    return (
      <div className="auth-container">
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            {toast.type === 'success' ? <Check size={16} /> : <Info size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
        <div className="auth-card glass-panel">
          <div className="auth-logo">
            <Compass className="logo-icon" size={40} style={{ color: 'var(--accent-primary)' }} />
            <h1 className="auth-logo-text">AI Trip Planner</h1>
            <p className="auth-subtitle">Design custom itineraries using Agentic AI</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
              onClick={() => setAuthTab('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
              onClick={() => setAuthTab('register')}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '12px', width: '100%' }}
              disabled={authLoading}
            >
              {authLoading ? <Loader className="spinner" size={16} /> : (authTab === 'login' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="auth-footer">
            <span>API URL Config:</span>
            <input
              type="text"
              className="form-group input"
              style={{ marginTop: '6px', width: '100%', padding: '6px 10px', fontSize: '12px' }}
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render main layout if authenticated
  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.type === 'success' ? <Check size={16} /> : <Info size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Section */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-container">
            <Compass className="logo-icon" size={26} />
            <h1 className="logo-text">AI Trip Planner</h1>
          </div>

          <div className="user-account-display">
            <div className="user-account-info">
              <div className="user-avatar-circle">
                {currentUser.username[0].toUpperCase()}
              </div>
              <span className="user-name-text">{currentUser.username}</span>
            </div>
            <button className="logout-icon-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            id="btn-preferences"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => setShowPreferencesModal(true)}
          >
            <Settings size={15} />
            Prefs
          </button>

          <button
            id="btn-new-trip"
            className="btn btn-primary"
            style={{ flex: 1.5 }}
            onClick={() => setShowNewTripModal(true)}
          >
            <Plus size={15} />
            New Trip
          </button>
        </div>

        <div className="trips-container">
          <div className="section-title">Your Trips</div>
          {tripsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader className="spinner" size={24} style={{ color: 'var(--accent-primary)' }} />
            </div>
          ) : trips.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>
              No trips yet. Create one to get started!
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.trip_id}
                id={`trip-card-${trip.trip_id}`}
                className={`trip-card ${activeTripId === trip.trip_id ? 'active' : ''}`}
                onClick={() => setActiveTripId(trip.trip_id)}
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
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Frame */}
      <main className="main-chat-area">
        <header className="chat-header glass-panel">
          <div className="chat-header-info">
            {activeTrip ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            onClick={() => handleRollback(v.version)}
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

        {/* Message Thread */}
        <div className="messages-wrapper">
          {!activeTripId ? (
            <div className="empty-chat">
              <Compass className="empty-chat-icon" size={60} />
              <p>Please select an existing trip from the sidebar or click "New Trip" to start designing an itinerary.</p>
            </div>
          ) : messages.length === 0 && !loading ? (
            <div className="empty-state animate-fade-in">
              <MessageSquare className="empty-state-icon" />
              <h3>Plan Your Next Adventure</h3>
              <p>
                Welcome to your agentic trip planner! I can help you draft itineraries, search hotels,
                fetch current weather, and calculate conversions. Choose a recommendation or type your request.
              </p>

              <div className="suggestions-grid">
                <div
                  className="suggestion-card"
                  onClick={() => handleSendMessage(null, `Plan a 3-day itinerary for ${activeTrip?.destination || 'Paris'} with sightseeing`)}
                >
                  <div className="suggestion-title">🗺️ Plan Itinerary</div>
                  <div className="suggestion-desc">Generate a complete multi-day schedule matched to your style.</div>
                </div>

                <div
                  className="suggestion-card"
                  onClick={() => handleSendMessage(null, `Suggest hotels in ${activeTrip?.destination || 'PAR'}`)}
                >
                  <div className="suggestion-title">🏨 Suggest Hotels</div>
                  <div className="suggestion-desc">Find available stays using live Amadeus integrations.</div>
                </div>

                <div
                  className="suggestion-card"
                  onClick={() => handleSendMessage(null, `What is the current weather in ${activeTrip?.destination || 'Paris'}?`)}
                >
                  <div className="suggestion-title">☀️ Get Weather</div>
                  <div className="suggestion-desc">Fetch live meteorological details for your destination.</div>
                </div>

                <div
                  className="suggestion-card"
                  onClick={() => handleSendMessage(null, "Convert 500 USD to EUR")}
                >
                  <div className="suggestion-title">💱 Convert Currency</div>
                  <div className="suggestion-desc">Check rates and convert between key currencies instantly.</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isHuman = msg.type === 'human';

                // 1. Tool Call rendering
                if (msg.tool_calls) {
                  return (
                    <div key={index} className="tool-call-block animate-fade-in">
                      {msg.tool_calls.map((tc, tcIdx) => {
                        const isExpanded = expandedTools[`${index}-${tcIdx}`];
                        return (
                          <div key={tcIdx}>
                            <div
                              className="tool-call-header"
                              onClick={() => toggleToolView(`${index}-${tcIdx}`)}
                            >
                              <div className="tool-title">
                                <RefreshCw className="spinner" size={13} style={{ color: 'var(--accent-secondary)' }} />
                                Running Tool: <strong>{tc.tool}</strong>
                              </div>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                            {isExpanded && (
                              <pre className="tool-args">
                                {JSON.stringify(tc.args, null, 2)}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // 2. Tool response rendering
                if (msg.type === 'tool') {
                  const isExpanded = expandedTools[`tool-${index}`];
                  return (
                    <div key={index} className="tool-call-block animate-fade-in" style={{ borderStyle: 'solid', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                      <div
                        className="tool-call-header"
                        onClick={() => toggleToolView(`tool-${index}`)}
                      >
                        <div className="tool-title" style={{ color: '#10b981' }}>
                          <Check size={13} />
                          Tool Result: <strong>{msg.tool_name}</strong>
                        </div>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                      {isExpanded && (
                        <pre className="tool-args" style={{ color: '#10b981' }}>
                          {msg.content}
                        </pre>
                      )}
                    </div>
                  );
                }

                // 3. Rich Trip Plan rendering
                if (msg.type === 'trip_plan') {
                  const plan = msg.content;
                  const currentDayTab = activeDayTabs[index] || (plan.days && plan.days[0]?.day) || 1;
                  const activeDayPlan = plan.days?.find(d => d.day === currentDayTab);

                  return (
                    <div key={index} className="message trip_plan animate-fade-in">
                      <div className="avatar">🤖</div>
                      <div className="message-content">
                        <span className="sender-name">Agent (Itinerary Plan)</span>
                        <div className="itinerary-card glow-card">
                          <div className="itinerary-hero">
                            <h3 className="itinerary-summary-title">Explore {activeTrip?.destination || 'Your Destination'}</h3>
                            <p className="itinerary-desc">{plan.trip_summary}</p>
                          </div>

                          <div className="itinerary-meta-grid">
                            <div className="meta-item">
                              <DollarSign className="meta-icon" size={18} />
                              <div>
                                <div className="meta-label">Est. Budget</div>
                                <div className="meta-value">
                                  {plan.estimated_budget?.amount?.toLocaleString()} {plan.estimated_budget?.currency}
                                </div>
                              </div>
                            </div>

                            <div className="meta-item">
                              <Thermometer className="meta-icon" size={18} />
                              <div>
                                <div className="meta-label">Weather Advice</div>
                                <div className="meta-value" style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                                  {plan.weather_advice}
                                </div>
                              </div>
                            </div>
                          </div>

                          {plan.days && plan.days.length > 0 && (
                            <>
                              <div className="itinerary-tabs">
                                {plan.days.map((d) => (
                                  <button
                                    key={d.day}
                                    className={`tab-btn ${currentDayTab === d.day ? 'active' : ''}`}
                                    onClick={() => setDayTab(index, d.day)}
                                  >
                                    Day {d.day}
                                  </button>
                                ))}
                              </div>

                              <div className="itinerary-content">
                                {activeDayPlan && (
                                  <div>
                                    <h4 className="day-plan-title">{activeDayPlan.title}</h4>
                                    <div className="activity-list">
                                      {activeDayPlan.activities?.map((act, actIdx) => (
                                        <div key={actIdx} className="activity-item">
                                          <span className="activity-num">{actIdx + 1}</span>
                                          <span>{act}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // 4. Custom Hotels rendering
                if (msg.type === 'hotels') {
                  const hotelsData = msg.content;
                  const hotelList = Array.isArray(hotelsData) ? hotelsData : (hotelsData.data || []);

                  return (
                    <div key={index} className="message hotels animate-fade-in">
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

                // 5. Default Chat Bubbles (Human/AI)
                return (
                  <div key={index} className={`message ${isHuman ? 'human' : 'ai'} animate-fade-in`}>
                    <div className="avatar">{isHuman ? '👤' : '🤖'}</div>
                    <div className="message-content">
                      <span className="sender-name">{isHuman ? 'You' : 'Agent'}</span>
                      <div className="bubble">
                        {!isHuman && msg.isNew ? (
                          <TypewriterText
                            text={msg.content}
                            speed={12}
                            onComplete={() => {
                              msg.isNew = false;
                            }}
                          />
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="loading-indicator">
                  <Loader className="spinner" size={16} />
                  <span>Agent is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar Section */}
        {activeTripId && (
          <footer className="input-panel glass-panel">
            <div className="suggestions-toolbar">
              <button
                className="tool-chip"
                onClick={() => setUserInput("Suggest 5 hotel")}
              >
                🏨 Hotel List
              </button>
              <button
                className="tool-chip"
                onClick={() => setUserInput(`What's the weather in ${activeTrip?.destination || 'London'}?`)}
              >
                ☀️ Get Weather
              </button>
              <button
                className="tool-chip"
                onClick={() => setUserInput("Convert 100 USD to INR")}
              >
                💱 Convert $100
              </button>
              {tripVersions.length > 0 && (
                <button
                  className="tool-chip"
                  style={{ borderColor: 'rgba(168, 85, 247, 0.3)', color: 'var(--accent-secondary)' }}
                  onClick={() => {
                    const activeVer = tripVersions.find(v => v.is_active);
                    if (activeVer) {
                      // Suggest rolling back to version minus 1
                      const prevVer = activeVer.version > 1 ? activeVer.version - 1 : 1;
                      setUserInput(`Restore version ${prevVer}`);
                    }
                  }}
                >
                  ⏪ Rollback Version
                </button>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="input-form">
              <textarea
                id="chat-textarea"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Ask the travel agent to design or adjust your trip to ${activeTrip?.destination || 'destination'}...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                id="btn-send-message"
                type="submit"
                className="send-btn"
                disabled={!userInput.trim() || loading}
              >
                <Send size={16} />
              </button>
            </form>
          </footer>
        )}
      </main>

      {/* Preferences Dialog */}
      {showPreferencesModal && (
        <div className="modal-overlay" onClick={() => setShowPreferencesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Travel Preferences</div>
            </div>

            <form onSubmit={savePreferences}>
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
                  onClick={() => setShowPreferencesModal(false)}
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
          </div>
        </div>
      )}

      {/* New Trip Dialog */}
      {showNewTripModal && (
        <div className="modal-overlay" onClick={() => setShowNewTripModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create New Trip Plan</div>
            </div>

            <form onSubmit={handleCreateTrip}>
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
                  onClick={() => setShowNewTripModal(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
