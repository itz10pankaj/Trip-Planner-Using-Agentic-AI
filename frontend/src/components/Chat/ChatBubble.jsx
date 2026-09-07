import TypewriterText from './TypewriterText';

// Default human/AI chat bubble. New AI messages (`isNew`) animate in
// word-by-word via TypewriterText, exactly as before.
export default function ChatBubble({ msg }) {
  const isHuman = msg.type === 'human';

  return (
    <div className={`message ${isHuman ? 'human' : 'ai'} animate-fade-in`}>
      <div className="avatar">{isHuman ? '👤' : '🤖'}</div>
      <div className="message-content">
        <span className="sender-name">{isHuman ? 'You' : 'Agent'}</span>
        <div className="bubble">
          {!isHuman && msg.isNew ? (
            <TypewriterText
              text={msg.content}
              speed={12}
              onComplete={() => {
                msg.isNew = false;
              }}
            />
          ) : (
            <span>{msg.content}</span>
          )}
        </div>
      </div>
    </div>
  );
}
