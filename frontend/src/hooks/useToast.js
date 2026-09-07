import { useState, useCallback } from 'react';

// Small self-contained toast hook: identical behavior to the original inline
// `toast` state + `showToast` helper that lived in App.jsx (3s auto-dismiss).
export default function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}
