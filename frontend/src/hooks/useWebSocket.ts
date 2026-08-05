import { useState, useEffect } from 'react';
import type { Client as StompClient, IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from '@/lib/constants';
import { Incident } from '@/types';

export interface LiveEvent {
  eventId: string;
  type: string;
  /** Partial: the broadcast carries a simulated incident, not a stored one. */
  incident?: Partial<Incident>;
  predictedSeverity?: string;
  timestamp?: string;
}

export function useWebSocket(topic: string = '/topic/incidents/live') {
  const [messages, setMessages] = useState<LiveEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<LiveEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let stompClient: StompClient | null = null;

    async function initStomp() {
      try {
        const { Client } = await import('@stomp/stompjs');
        const SockJS = (await import('sockjs-client')).default;

        stompClient = new Client({
          webSocketFactory: () => new SockJS(WS_BASE_URL),
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            setIsConnected(true);
            stompClient?.subscribe(topic, (message: IMessage) => {
              if (message.body) {
                try {
                  const event: LiveEvent = JSON.parse(message.body);
                  setLatestEvent(event);
                  setMessages((prev) => [event, ...prev].slice(0, 50));
                } catch (err) {
                  console.error('WebSocket parse error:', err);
                }
              }
            });
          },
          onDisconnect: () => setIsConnected(false),
          onStompError: () => setIsConnected(false),
        });

        stompClient.activate();
      } catch {
        setIsConnected(false);
      }
    }

    initStomp();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [topic]);

  return { latestEvent, messages, isConnected };
}
