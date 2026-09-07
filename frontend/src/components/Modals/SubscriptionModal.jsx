import { Zap } from 'lucide-react';
import Spinner from '../Common/Spinner';
import ModalOverlay from './ModalOverlay';
import './modals.css';

export default function SubscriptionModal({ show, onClose, subscription, subLoading, onUpgrade, formatDate }) {
  if (!show) return null;

  const activeTier = subscription?.active_tier || 'free';

  return (
    <ModalOverlay onClose={onClose} contentClassName="subscription-modal">
      <div className="modal-header">
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap style={{ color: 'var(--accent-primary)' }} size={20} />
          User Subscription Settings
        </div>
      </div>

      <div className="modal-body">
        {/* Current Active Plan Overview */}
        <div className="subs-current-box">
          <div className="subs-current-header">
            <span className="subs-current-title">Active Subscription Status</span>
            <span className={`user-subs-badge ${activeTier}`}>
              {activeTier.toUpperCase()} TIER
            </span>
          </div>

          <div className="subs-details-grid">
            <div className="subs-detail-item">
              <span className="subs-detail-label">AI Model</span>
              <span className="subs-detail-value">{subscription?.plan_details?.model || 'gpt-4o-mini'}</span>
            </div>
            <div className="subs-detail-item">
              <span className="subs-detail-label">Daily Limit</span>
              <span className="subs-detail-value">{subscription?.plan_details?.daily_limit || 10} Req/Day</span>
            </div>
            <div className="subs-detail-item">
              <span className="subs-detail-label">Expiration</span>
              <span className="subs-detail-value" style={{ fontSize: '12px' }}>
                {subscription?.expires_at ? formatDate(subscription.expires_at) : 'Never (Free)'}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade / Change Plan Section */}
        <div className="section-title" style={{ marginTop: '8px', paddingLeft: 0 }}>
          Choose Your Plan Tier
        </div>

        <div className="plans-grid">
          {/* FREE PLAN */}
          <div className={`plan-card ${activeTier === 'free' ? 'active-plan' : ''}`}>
            {activeTier === 'free' && <span className="plan-badge-top">Current</span>}
            <div className="plan-header">
              <span className="plan-name">Free Plan</span>
              <span className="plan-price">$0<span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span></span>
            </div>
            <div className="plan-features">
              <div className="plan-feature-item">✓ 10 Requests / Day</div>
              <div className="plan-feature-item">✓ gpt-4o-mini Model</div>
              <div className="plan-feature-item">✓ Core Features</div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '13px' }}
              disabled={activeTier === 'free' || subLoading}
              onClick={() => onUpgrade('free')}
            >
              {activeTier === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* PRO PLAN */}
          <div className={`plan-card ${activeTier === 'pro' ? 'active-plan' : ''}`}>
            {activeTier === 'pro' && <span className="plan-badge-top">Current</span>}
            <div className="plan-header">
              <span className="plan-name" style={{ color: 'var(--accent-secondary)' }}>Pro Plan</span>
              <span className="plan-price">$15<span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span></span>
            </div>
            <div className="plan-features">
              <div className="plan-feature-item">✓ 100 Requests / Day</div>
              <div className="plan-feature-item">✓ GPT-4o Model</div>
              <div className="plan-feature-item">✓ Fast Processing</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '13px' }}
              disabled={activeTier === 'pro' || subLoading}
              onClick={() => onUpgrade('pro')}
            >
              {subLoading ? <Spinner size={14} /> : (activeTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro')}
            </button>
          </div>

          {/* PREMIUM PLAN */}
          <div className={`plan-card ${activeTier === 'premium' ? 'active-plan' : ''}`}>
            {activeTier === 'premium' && <span className="plan-badge-top">Current</span>}
            <div className="plan-header">
              <span className="plan-name" style={{ color: '#fbbf24' }}>Premium Plan</span>
              <span className="plan-price">$29<span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span></span>
            </div>
            <div className="plan-features">
              <div className="plan-feature-item">✓ 1000 Requests / Day</div>
              <div className="plan-feature-item">✓ Top-Tier GPT-4o</div>
              <div className="plan-feature-item">✓ Priority Support</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '13px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
              disabled={activeTier === 'premium' || subLoading}
              onClick={() => onUpgrade('premium')}
            >
              {subLoading ? <Spinner size={14} /> : (activeTier === 'premium' ? 'Current Plan' : 'Upgrade to Premium')}
            </button>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          className="btn btn-secondary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </ModalOverlay>
  );
}
