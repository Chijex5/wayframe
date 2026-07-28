import { useCallback, useEffect, useRef, useState } from 'react';

type UseMockStreamOptions = {
  /** Milliseconds between revealed chunks. */
  intervalMs?: number;
  /** Characters revealed per tick. */
  chunkSize?: number;
};

export function useMockStream({
  intervalMs = 35,
  chunkSize = 3
}: UseMockStreamOptions = {}) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const start = useCallback(
    (fullText: string) => {
      clearTimer();
      setText('');
      setIsStreaming(true);

      let cursor = 0;
      timerRef.current = window.setInterval(() => {
        cursor = Math.min(cursor + chunkSize, fullText.length);
        setText(fullText.slice(0, cursor));

        if (cursor >= fullText.length) {
          clearTimer();
          setIsStreaming(false);
        }
      }, intervalMs);
    },
    [chunkSize, clearTimer, intervalMs]
  );

  const reset = useCallback(() => {
    clearTimer();
    setText('');
    setIsStreaming(false);
  }, [clearTimer]);

  return { text, isStreaming, start, reset };
}