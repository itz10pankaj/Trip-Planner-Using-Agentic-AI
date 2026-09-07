import { useState, useEffect } from 'react';
import useToast from './hooks/useToast';
import {
  fetchTripsApi,
  createTripApi,
  fetchPreferencesApi,
  savePreferencesApi,
  fetchSubscriptionApi,
  verifyCheckoutSessionApi,
  createCheckoutSessionApi,
  fetchVersionsApi,
  fetchHistoryApi,
  rollbackVersionApi,
  sendChatMessageApi,
} from './api/client';

// Shared stylesheets that aren't owned by a single always-mounted component
// (buttons/toast/spinner/badges, and the chat header/message-list/input-bar
// styles) are imported once here so they're guaranteed to be in the bundle.
import './components/Common/common.css';
import './components/Chat/chat.css';

import Toast from './components/Common/Toast';
import AuthScreen from './components/Auth/AuthScreen';
import Sidebar from './components/Sidebar/Sidebar';
import ChatHeader from './components/Chat/ChatHeader';
import MessageList from './components/Chat/MessageList';
import ChatInputBar from './components/Chat/ChatInputBar';
import PreferencesModal from './components/Modals/PreferencesModal';
import NewTripModal from './components/Modals/NewTripModal';
import SubscriptionModal from './components/Modals/SubscriptionModal';

function App() {
  // App Config States
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [userId, setUserId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');

  // Subscription State
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { toast, showToast } = useToast();

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

  // Load Trips, Preferences & Subscription when User ID changes
  useEffect(() => {
    if (userId) {
      fetchTrips();
      fetchPreferences();
      fetchSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, apiUrl]);

  // Fetch Versions when activeTripId changes
  useEffect(() => {
    if (activeTripId) {
      fetchVersions(activeTripId);
    } else {
      setTripVersions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTripId, apiUrl]);

  // Fetch Trips
  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const data = await fetchTripsApi(apiUrl, userId);
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
      const data = await fetchPreferencesApi(apiUrl, userId);
      if (data && data.status === 'success' && data.data) {
        setPreferences(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch User Subscription Details
  const fetchSubscription = async () => {
    if (!userId) return;
    try {
      const data = await fetchSubscriptionApi(apiUrl, userId);
      if (data && data.status === 'success' && data.data) {
        setSubscription(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription', err);
    }
  };

  // Handle payment return parameters from Stripe redirect
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment');
    const sessionId = queryParams.get('session_id');
    const tier = queryParams.get('tier');

    if (paymentStatus === 'success' && sessionId && userId) {
      verifyCheckoutSessionApi(apiUrl, { sessionId, userId, tier })
        .then((data) => {
          if (data && data.status === 'success') {
            showToast(`🎉 Payment successful! You are now on the ${(tier || 'pro').toUpperCase()} plan!`);
            fetchSubscription();
          }
        })
        .catch(err => console.error('Verification failed', err));

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      showToast('Payment checkout was cancelled.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, apiUrl]);

  // Upgrade User Subscription via Stripe Checkout
  const handleUpgradeSubscription = async (targetTier) => {
    setSubLoading(true);
    try {
      const { ok, data } = await createCheckoutSessionApi(apiUrl, {
        userId,
        subscriptionType: targetTier,
        origin: window.location.origin,
      });
      if (ok && data.status === 'success') {
        if (data.mode === 'stripe' && data.checkout_url) {
          showToast('Redirecting to Stripe Secure Checkout... 💳');
          window.location.href = data.checkout_url;
        } else {
          showToast(`Upgraded to ${targetTier.toUpperCase()} plan successfully! 🚀`);
          setSubscription(data.data);
          fetchSubscription();
        }
      } else {
        showToast(data.detail || 'Failed to initiate checkout.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to subscription server.', 'error');
    } finally {
      setSubLoading(false);
    }
  };

  // Fetch Itinerary Versions
  const fetchVersions = async (tripId) => {
    try {
      const data = await fetchVersionsApi(apiUrl, tripId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTripId, apiUrl]);

  const fetchHistory = async (tripId) => {
    setLoading(true);
    try {
      const data = await fetchHistoryApi(apiUrl, tripId);
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

  // Called by AuthScreen after a successful login/register+login
  const completeLogin = (loginData) => {
    const userObj = { username: loginData.username, user_id: loginData.user_id };
    setCurrentUser(userObj);
    setUserId(loginData.user_id);
    localStorage.setItem('trip_planner_user', JSON.stringify(userObj));
    showToast(`Logged in as ${loginData.username} 🎉`);
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
      const data = await savePreferencesApi(apiUrl, userId, preferences);
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
      const data = await createTripApi(apiUrl, userId, {
        title: newTripTitle,
        destination: newTripDestination,
      });
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
      const { status, data } = await sendChatMessageApi(apiUrl, activeTripId, userId, query);

      if (status === 429 || data?.detail?.type === 'rate_limit_exceeded' || data?.type === 'rate_limit_exceeded') {
        const errorDetails = data?.detail || data;
        const errorMsg = errorDetails.message || 'Daily rate limit reached for your subscription plan.';

        setMessages(prev => [...prev, {
          type: 'rate_limit_error',
          content: {
            message: errorMsg,
            current_usage: errorDetails.current_usage || 10,
            daily_limit: errorDetails.daily_limit || 10,
            subscription_type: errorDetails.subscription_type || 'free'
          },
          isNew: true
        }]);

        showToast('Daily rate limit reached! Upgrade to continue.', 'error');
        fetchSubscription();
        return;
      }

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
        // Refresh sidebar, subscription, and version list
        fetchTrips();
        fetchSubscription();
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
      const data = await rollbackVersionApi(apiUrl, activeTripId, versionNum);
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
      <AuthScreen
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        onLoginSuccess={completeLogin}
        toast={toast}
        showToast={showToast}
      />
    );
  }

  // Render main layout if authenticated
  return (
    <div className="app-container">
      <Toast toast={toast} />

      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <Sidebar
        currentUser={currentUser}
        subscription={subscription}
        trips={trips}
        tripsLoading={tripsLoading}
        activeTripId={activeTripId}
        setActiveTripId={setActiveTripId}
        formatDate={formatDate}
        onOpenPreferences={() => setShowPreferencesModal(true)}
        onOpenNewTrip={() => setShowNewTripModal(true)}
        onOpenSubscription={() => setShowSubscriptionModal(true)}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="main-chat-area">
        <ChatHeader
          activeTrip={activeTrip}
          tripVersions={tripVersions}
          showVersionDropdown={showVersionDropdown}
          setShowVersionDropdown={setShowVersionDropdown}
          onRollback={handleRollback}
          formatDate={formatDate}
          apiUrl={apiUrl}
          setApiUrl={setApiUrl}
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        <MessageList
          activeTripId={activeTripId}
          activeTrip={activeTrip}
          messages={messages}
          loading={loading}
          activeDayTabs={activeDayTabs}
          setDayTab={setDayTab}
          expandedTools={expandedTools}
          toggleToolView={toggleToolView}
          onSuggestion={(text) => handleSendMessage(null, text)}
          onUpgradeClick={() => setShowSubscriptionModal(true)}
        />

        {activeTripId && (
          <ChatInputBar
            activeTrip={activeTrip}
            userInput={userInput}
            setUserInput={setUserInput}
            onSend={handleSendMessage}
            loading={loading}
            tripVersions={tripVersions}
          />
        )}
      </main>

      <PreferencesModal
        show={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={preferences}
        setPreferences={setPreferences}
        onSave={savePreferences}
      />

      <NewTripModal
        show={showNewTripModal}
        onClose={() => setShowNewTripModal(false)}
        newTripTitle={newTripTitle}
        setNewTripTitle={setNewTripTitle}
        newTripDestination={newTripDestination}
        setNewTripDestination={setNewTripDestination}
        onCreate={handleCreateTrip}
      />

      <SubscriptionModal
        show={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        subscription={subscription}
        subLoading={subLoading}
        onUpgrade={handleUpgradeSubscription}
        formatDate={formatDate}
      />
    </div>
  );
}

export default App;
