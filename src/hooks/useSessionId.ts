import { useMemo } from "react";

export function useSessionId(): string {
  return useMemo(() => {
    const stored = sessionStorage.getItem("portfolio_session_id");
    if (stored) return stored;

    const newId = crypto.randomUUID();
    sessionStorage.setItem("portfolio_session_id", newId);
    return newId;
  }, []);
}
