import { useEffect, useRef } from 'react';
import Spinner from '../Common/Spinner';
import ToolCallMessage from './ToolCallMessage';
import ToolResultMessage from './ToolResultMessage';
import ChatBubble from './ChatBubble';
import RateLimitMessage from './RateLimitMessage';
import TripPlanMessage from '../Itinerary/TripPlanMessage';
import HotelsMessage from '../Itinerary/HotelsMessage';
import { NoTripSelected, ChatSuggestions } from './EmptyStates';

// Renders the whole message thread for the active trip, including the two
// "nothing to show yet" states. Owns the scroll-to-bottom effect itself
// (same dependency array as the original: [messages, loading]).
export default function MessageList({
  activeTripId,
  activeTrip,
  messages,
  loading,
  activeDayTabs,
  setDayTab,
  expandedTools,
  toggleToolView,
  onSuggestion,
  onUpgradeClick,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!activeTripId) {
    return (
      <div className="messages-wrapper">
        <NoTripSelected />
      </div>
    );
  }

  if (messages.length === 0 && !loading) {
    return (
      <div className="messages-wrapper">
        <ChatSuggestions activeTrip={activeTrip} onSuggestion={onSuggestion} />
      </div>
    );
  }

  return (
    <div className="messages-wrapper">
      {messages.map((msg, index) => {
        // 1. Tool Call rendering
        if (msg.tool_calls) {
          return (
            <ToolCallMessage
              key={index}
              index={index}
              toolCalls={msg.tool_calls}
              expandedTools={expandedTools}
              toggleToolView={toggleToolView}
            />
          );
        }

        // 2. Tool response rendering
        if (msg.type === 'tool') {
          return (
            <ToolResultMessage
              key={index}
              index={index}
              msg={msg}
              expandedTools={expandedTools}
              toggleToolView={toggleToolView}
            />
          );
        }

        // 3. Rich Trip Plan rendering
        if (msg.type === 'trip_plan') {
          return (
            <TripPlanMessage
              key={index}
              index={index}
              plan={msg.content}
              activeTrip={activeTrip}
              activeDayTabs={activeDayTabs}
              setDayTab={setDayTab}
            />
          );
        }

        // 4. Custom Hotels rendering
        if (msg.type === 'hotels') {
          return (
            <HotelsMessage key={index} hotelsData={msg.content} activeTrip={activeTrip} />
          );
        }

        // 5. Rate Limit Error rendering
        if (msg.type === 'rate_limit_error') {
          return (
            <RateLimitMessage key={index} info={msg.content} onUpgradeClick={onUpgradeClick} />
          );
        }

        // 6. Default Chat Bubbles (Human/AI)
        return <ChatBubble key={index} msg={msg} />;
      })}

      {loading && (
        <div className="loading-indicator">
          <Spinner size={16} />
          <span>Agent is thinking...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
