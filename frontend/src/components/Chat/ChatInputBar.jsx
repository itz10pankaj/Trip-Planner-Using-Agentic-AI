import { Send } from 'lucide-react';

// Quick-suggestion chips + the message textarea/send button. Only rendered
// by MainChatArea when there's an active trip, matching the original
// `{activeTripId && (...)}` guard.
export default function ChatInputBar({
  activeTrip,
  userInput,
  setUserInput,
  onSend,
  loading,
  tripVersions,
}) {
  return (
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

      <form onSubmit={onSend} className="input-form">
        <textarea
          id="chat-textarea"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={`Ask the travel agent to design or adjust your trip to ${activeTrip?.destination || 'destination'}...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
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
  );
}
