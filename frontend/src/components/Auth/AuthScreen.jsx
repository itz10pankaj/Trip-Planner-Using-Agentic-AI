import { useState } from 'react';
import { Compass, Loader } from 'lucide-react';
import { authRequest } from '../../api/client';
import Toast from '../Common/Toast';
import './auth.css';

// Full-screen login / registration gate, shown whenever there is no
// `currentUser`. Owns its own form state (username/password/tab/loading) --
// none of that is needed anywhere else in the app -- and reports a
// successful login back up via `onLoginSuccess`, exactly like the original
// `completeLogin` call site.
export default function AuthScreen({ apiUrl, setApiUrl, onLoginSuccess, toast, showToast }) {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setAuthLoading(true);
    const endpoint = authTab === 'login' ? 'login' : 'register';
    try {
      const { ok, data } = await authRequest(apiUrl, endpoint, {
        username: authUsername,
        password: authPassword,
      });
      if (ok && data?.status === 'success') {
        if (authTab === 'register') {
          showToast('Registration successful! Logging you in...');
          // Auto login after registration
          const loginResult = await authRequest(apiUrl, 'login', {
            username: authUsername,
            password: authPassword,
          });
          if (loginResult.ok && loginResult.data?.status === 'success') {
            onLoginSuccess(loginResult.data);
            setAuthUsername('');
            setAuthPassword('');
          }
        } else {
          onLoginSuccess(data);
          setAuthUsername('');
          setAuthPassword('');
        }
      } else {
        showToast(data?.detail || 'Authentication failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to authentication server.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toast toast={toast} />
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
