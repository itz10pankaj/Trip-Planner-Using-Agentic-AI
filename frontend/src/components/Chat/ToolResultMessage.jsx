import { Check, ChevronDown, ChevronUp } from 'lucide-react';

// Renders the "Tool Result: X" collapsible block for a `type: 'tool'` message.
export default function ToolResultMessage({ index, msg, expandedTools, toggleToolView }) {
  const key = `tool-${index}`;
  const isExpanded = expandedTools[key];

  return (
    <div className="tool-call-block animate-fade-in" style={{ borderStyle: 'solid', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
      <div className="tool-call-header" onClick={() => toggleToolView(key)}>
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
