import { useEffect, useState } from "react";

const hasJapanese = (s: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(s);

export function useTypewriter(text: string, isLatest: boolean) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // If it's an old message or not a bot message, show it all immediately.
    if (!isLatest || !text) {
      setDisplayed(text);
      setIsComplete(true);
      return;
    }

    // Reset for the new message
    setDisplayed("");
    setIsComplete(false);

    // Dynamic speed: Japanese renders better slightly faster per character (20ms vs 30ms)
    const speed = hasJapanese(text) ? 20 : 30; 
    const initialThinkingDelay = 800; // "Processing..." pause before streaming starts

    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i));
        i++;
        if (i > text.length) {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, initialThinkingDelay);

    return () => clearTimeout(timeout);
  }, [text, isLatest]);

  return { displayed, isComplete };
}