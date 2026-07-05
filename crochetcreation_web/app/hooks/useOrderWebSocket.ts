import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  action: 'order_created' | 'order_updated';
  data: any;
}

export function useOrderWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000); // Start with 1 second

  useEffect(() => {
    let active = true;

    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Convert http/https to ws/wss
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/api/ws';
      
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        console.log('WebSocket connected successfully.');
        setIsConnected(true);
        reconnectDelayRef.current = 1000; // Reset reconnection delay
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const payload = JSON.parse(event.data);
          console.log('Received WebSocket message:', payload);
          if (onMessage) {
            onMessage(payload);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = (event) => {
        if (!active) return;
        setIsConnected(false);
        console.log(`WebSocket closed: ${event.reason || 'No reason'}. Attempting to reconnect...`);
        scheduleReconnect();
      };

      socket.onerror = (err) => {
        console.error('WebSocket error occurred:', err);
      };
    }

    function scheduleReconnect() {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      const delay = reconnectDelayRef.current;
      // Exponential backoff with jitter, maxing at 30 seconds
      reconnectDelayRef.current = Math.min(delay * 2 + Math.random() * 500, 30000);
      console.log(`Scheduling reconnect in ${delay.toFixed(0)}ms`);
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
  }, [onMessage]);

  return { isConnected };
}
