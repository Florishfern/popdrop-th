"use client";

import { useEffect } from "react";

export interface RealtimeEvent {
  type: "NEW_ORDER" | "NEW_BID" | "ORDER_STATUS_CHANGE";
  payload: unknown;
}

export function useSellerRealtime(onEvent?: (event: RealtimeEvent) => void) {
  useEffect(() => {
    // In production, connect to WebSocket (e.g. wss://api.popdrop.th/v1/ws) or SSE
    // Here we set up a polling / event simulation ready for WebSocket upgrade
    const interval = setInterval(() => {
      // Periodic check or heartbeat signal
    }, 15000);

    return () => clearInterval(interval);
  }, [onEvent]);
}
