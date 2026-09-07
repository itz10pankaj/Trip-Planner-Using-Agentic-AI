import { Zap } from 'lucide-react';

export default function RateLimitMessage({ info, onUpgradeClick }) {
  return (
    <div className="message rate_limit_error animate-fade-in">
      <div className="avatar">⚠️</div>
      <div className="message-content">
        <span className="sender-name">System (Rate Limit Exceeded)</span>
        <div className="rate-limit-card">
          <div className="rate-limit-header">
            <span className="rate-limit-icon">🛑</span>
            <div>
              <div className="rate-limit-title">Daily Request Limit Reached</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {info.current_usage} / {info.daily_limit} requests used today on {info.subscription_type?.toUpperCase()} plan
              </div>
            </div>
          </div>
          <p className="rate-limit-desc">{info.message}</p>
          <div className="rate-limit-actions">
            <button
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 14px' }}
              onClick={onUpgradeClick}
            >
              <Zap size={14} />
              Upgrade Subscription Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
