import { useState, useEffect, useRef, useCallback } from "react";
import { messagesApi, getAccessToken } from "../services/api";

export interface ChatMessage {
  id: string;
  client_msg_id?: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "student" | "counselor" | string;
  content: string;
  created_at: string;
  is_read: boolean;
  isOptimistic?: boolean;
  error?: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseChatWebSocketOptions {
  conversationId: string | null;
  enabled?: boolean;
  onMessageReceived?: (message: ChatMessage) => void;
}

export function useChatWebSocket({
  conversationId,
  enabled = true,
  onMessageReceived,
}: UseChatWebSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // 1. Fetch historical messages
  const loadHistory = useCallback(async (convId: string) => {
    try {
      setIsLoadingHistory(true);
      const res = await messagesApi.getMessages(convId);
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load message history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // 2. Connect WebSocket
  const connect = useCallback(() => {
    if (!conversationId || !enabled) return;

    const token = getAccessToken() || localStorage.getItem("mindsaathi_access_token") || localStorage.getItem("token") || "";
    if (!token) {
      // In local demo / unauthenticated mode, remain disconnected without error banner
      setStatus("disconnected");
      setError(null);
      return;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus("connecting");
    setError(null);

    const customWsBase = import.meta.env.VITE_WS_URL;
    let wsUrl = "";
    if (customWsBase) {
      const cleanBase = customWsBase.replace(/\/$/, "");
      wsUrl = `${cleanBase}/ws/chat/${conversationId}?token=${encodeURIComponent(token)}`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/api/v1/ws/chat/${conversationId}?token=${encodeURIComponent(token)}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message" && data.message) {
            const incomingMsg: ChatMessage = data.message;
            setMessages((prev) => {
              // Deduplicate by id or client_msg_id
              const existingIdx = prev.findIndex(
                (m) =>
                  m.id === incomingMsg.id ||
                  (incomingMsg.client_msg_id && m.client_msg_id === incomingMsg.client_msg_id)
              );
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = { ...incomingMsg, isOptimistic: false };
                return next;
              }
              return [...prev, incomingMsg];
            });

            if (onMessageReceived) {
              onMessageReceived(incomingMsg);
            }
          } else if (data.type === "typing") {
            setIsOtherTyping(Boolean(data.is_typing));
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            if (data.is_typing) {
              typingTimerRef.current = window.setTimeout(() => {
                if (isMountedRef.current) setIsOtherTyping(false);
              }, 3500);
            }
          } else if (data.type === "read") {
            setMessages((prev) =>
              prev.map((m) => (m.sender_role !== data.reader_role ? { ...m, is_read: true } : m))
            );
          } else if (data.type === "user_status") {
            if (data.status === "online") {
              setIsOtherOnline(true);
            } else if (data.status === "offline") {
              setIsOtherOnline(false);
            }
          } else if (data.type === "error") {
            console.warn("WebSocket received application error:", data);
            if (data.message) {
              setError(data.message);
            }
          }
        } catch (parseErr) {
          console.error("Failed to parse WebSocket message:", parseErr);
        }
      };

      ws.onerror = (evt) => {
        console.warn("WebSocket encountered error:", evt);
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setStatus("disconnected");
        socketRef.current = null;

        // If closed abnormally (not a deliberate logout or 4403 permission rejection)
        if (event.code !== 1000 && event.code !== 1008 && event.code !== 4403 && enabled) {
          const backoff = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isMountedRef.current && enabled) {
              connect();
            }
          }, backoff);
        } else if (event.code === 1008 || event.code === 4403) {
          setError("Session access restricted or appointment not confirmed.");
        }
      };
    } catch (err: any) {
      console.error("WebSocket connection setup failed:", err);
      setStatus("error");
      setError(err.message || "Failed to establish WebSocket connection.");
    }
  }, [conversationId, enabled, onMessageReceived]);

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (conversationId && enabled) {
      loadHistory(conversationId);
      connect();
    } else {
      setStatus("disconnected");
      setMessages([]);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [conversationId, enabled, connect, loadHistory]);

  // 3. Send Message
  const sendMessage = useCallback(
    async (content: string, userRole: "student" | "counselor" = "student") => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId) return;

      const clientMsgId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const optimisticMessage: ChatMessage = {
        id: clientMsgId,
        client_msg_id: clientMsgId,
        conversation_id: conversationId,
        sender_id: "me",
        sender_role: userRole,
        content: trimmed,
        created_at: new Date().toISOString(),
        is_read: false,
        isOptimistic: true,
      };

      // Add optimistic message
      setMessages((prev) => [...prev, optimisticMessage]);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "message",
            content: trimmed,
            client_msg_id: clientMsgId,
          })
        );
      } else {
        // Fallback to REST API
        try {
          const res = await messagesApi.sendMessage(trimmed, conversationId);
          if (res.success && res.data) {
            setMessages((prev) =>
              prev.map((m) =>
                m.client_msg_id === clientMsgId
                  ? { ...res.data, isOptimistic: false }
                  : m
              )
            );
          }
        } catch (restErr: any) {
          console.error("REST fallback message sending failed:", restErr);
          setMessages((prev) =>
            prev.map((m) =>
              m.client_msg_id === clientMsgId
                ? { ...m, error: "Failed to send. Click to retry." }
                : m
            )
          );
        }
      }
    },
    [conversationId]
  );

  // 4. Send Typing Indicator
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "typing",
            is_typing: isTyping,
          })
        );
      }
    },
    []
  );

  // 5. Mark as read
  const markAsRead = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "read" }));
    }
    if (conversationId) {
      messagesApi.markRead(conversationId).catch(() => {});
    }
  }, [conversationId]);

  return {
    messages,
    status,
    isOtherTyping,
    isOtherOnline,
    error,
    isLoadingHistory,
    sendMessage,
    sendTyping,
    markAsRead,
    reconnect: connect,
  };
}
