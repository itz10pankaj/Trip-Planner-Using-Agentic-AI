// Shared overlay + content shell used by all three dialogs. Clicking the
// dark backdrop closes the modal (via onClose); clicking inside the content
// panel does not (stopPropagation), matching the original behavior.
export default function ModalOverlay({ onClose, contentClassName = '', children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${contentClassName}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
