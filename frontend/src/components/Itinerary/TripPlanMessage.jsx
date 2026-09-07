import { DollarSign, Thermometer } from 'lucide-react';
import './itinerary.css';

// Rich itinerary card rendered for a `type: 'trip_plan'` chat message.
export default function TripPlanMessage({ index, plan, activeTrip, activeDayTabs, setDayTab }) {
  const currentDayTab = activeDayTabs[index] || (plan.days && plan.days[0]?.day) || 1;
  const activeDayPlan = plan.days?.find(d => d.day === currentDayTab);

  return (
    <div className="message trip_plan animate-fade-in">
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
