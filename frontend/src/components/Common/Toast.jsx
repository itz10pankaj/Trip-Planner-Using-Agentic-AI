import { Check, Info } from 'lucide-react';

// Renders the floating toast notification. Returns null when there is nothing
// to show, so it can be dropped in unconditionally at the top of a screen.
export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
      {toast.type === 'success' ? <Check size={16} /> : <Info size={16} />}
      <span>{toast.message}</span>
    </div>
  );
}
