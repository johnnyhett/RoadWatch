import { useState, useEffect } from 'react';
import { WS_BASE_URL } from '@/lib/constants';

export interface LiveEvent {
  eventId: string;
  type: string;
  incident?: any;
  predictedSeverity?: string;
  timestamp?: string;
}

export function useWebSocket(topic: string = '/topic/incidents/live') {
  const [messages, setMessages] = useState<LiveEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<LiveEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let stompClient: any = null;

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
            stompClient.subscribe(topic, (message: any) => {
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
      } catch (err) {
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
