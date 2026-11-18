import { useCallback, useEffect, useState } from "react";

/** Counts down once per second after `start()`. `remaining` is 0 when the action is allowed again. */
export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);
  return { remaining, start };
}
