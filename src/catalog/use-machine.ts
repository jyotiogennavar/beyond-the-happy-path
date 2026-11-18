"use client";

import { useCallback, useState } from "react";

export function useMachine<S extends string, E extends { type: string }>(
  transition: (state: S, event: E) => S,
  initial: S,
) {
  const [state, setState] = useState(initial);

  const send = useCallback(
    (event: E) => {
      setState((current) => transition(current, event));
    },
    [transition],
  );

  const jump = useCallback((next: S) => {
    setState(next);
  }, []);

  return { state, send, jump };
}
