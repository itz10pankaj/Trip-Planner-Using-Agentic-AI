import { useState, useEffect } from 'react';

// Renders `text` word-by-word to simulate the agent "typing". Unchanged from
// the original implementation.
export default function TypewriterText({ text, speed = 15, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) return;
    const words = text.split(' ');
    let index = 0;
    setDisplayedText('');

    const timer = setInterval(() => {
      if (index < words.length) {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[index]);
        index++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
}
