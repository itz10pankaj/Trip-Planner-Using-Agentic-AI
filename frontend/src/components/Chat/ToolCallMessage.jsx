import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// Renders the "Running Tool: X" collapsible block for an assistant message
// that contains one or more `tool_calls`.
export default function ToolCallMessage({ index, toolCalls, expandedTools, toggleToolView }) {
  return (
    <div className="tool-call-block animate-fade-in">
      {toolCalls.map((tc, tcIdx) => {
        const key = `${index}-${tcIdx}`;
        const isExpanded = expandedTools[key];
        return (
          <div key={tcIdx}>
            <div className="tool-call-header" onClick={() => toggleToolView(key)}>
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
