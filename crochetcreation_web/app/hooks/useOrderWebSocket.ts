import { useEffect, useRef, useState } from 'react';
import { getApiUrl } from '../utils/apiFetch';

export interface WebSocketMessage {
  action: 'order_created' | 'order_updated';
  data: any;
}

export function useOrderWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000); // Start with 1 second
  const savedOnMessage = useRef(onMessage);

  useEffect(() => {
    savedOnMessage.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let active = true;

    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const token = localStorage.getItem('token');
      // The server rejects anonymous sockets, so don't open one — and don't
      // start a reconnect loop against a connection that can never succeed.
      if (!token) return;

      const API_URL = getApiUrl();
      // Convert http/https to ws/wss
      const wsUrl = `${API_URL.replace(/^http/, 'ws')}/api/ws?token=${encodeURIComponent(token)}`;

      // Never log the URL itself: it carries the access token.
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        setIsConnected(true);
        reconnectDelayRef.current = 1000; // Reset reconnection delay
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const payload = JSON.parse(event.data);
          if (savedOnMessage.current) {
            savedOnMessage.current(payload);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = (event) => {
        if (!active) return;
        setIsConnected(false);
        // 4001 means the server rejected our credentials; retrying with the
        // same token would just loop forever.
        if (event.code === 4001) return;
        scheduleReconnect();
      };

      socket.onerror = () => {
        // onclose always follows; reconnection is handled there.
      };
    }

    function scheduleReconnect() {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      const delay = reconnectDelayRef.current;
      // Exponential backoff with jitter, maxing at 30 seconds
      reconnectDelayRef.current = Math.min(delay * 2 + Math.random() * 500, 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (active) {
          connect();
        }
      }, delay);
    }

    connect();

    return () => {
      active = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { isConnected };
}
