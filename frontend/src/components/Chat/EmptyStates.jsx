import { Compass, MessageSquare } from 'lucide-react';

export function NoTripSelected() {
  return (
    <div className="empty-chat">
      <Compass className="empty-chat-icon" size={60} />
      <p>Please select an existing trip from the sidebar or click "New Trip" to start designing an itinerary.</p>
    </div>
  );
}

export function ChatSuggestions({ activeTrip, onSuggestion }) {
  return (
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
          onClick={() => onSuggestion(`Plan a 3-day itinerary for ${activeTrip?.destination || 'Paris'} with sightseeing`)}
        >
          <div className="suggestion-title">🗺️ Plan Itinerary</div>
          <div className="suggestion-desc">Generate a complete multi-day schedule matched to your style.</div>
        </div>

        <div
          className="suggestion-card"
          onClick={() => onSuggestion(`Suggest hotels in ${activeTrip?.destination || 'PAR'}`)}
        >
          <div className="suggestion-title">🏨 Suggest Hotels</div>
          <div className="suggestion-desc">Find available stays using live Amadeus integrations.</div>
        </div>

        <div
          className="suggestion-card"
          onClick={() => onSuggestion(`What is the current weather in ${activeTrip?.destination || 'Paris'}?`)}
        >
          <div className="suggestion-title">☀️ Get Weather</div>
          <div className="suggestion-desc">Fetch live meteorological details for your destination.</div>
        </div>

        <div
          className="suggestion-card"
          onClick={() => onSuggestion("Convert 500 USD to EUR")}
        >
          <div className="suggestion-title">💱 Convert Currency</div>
          <div className="suggestion-desc">Check rates and convert between key currencies instantly.</div>
        </div>
      </div>
    </div>
  );
}
