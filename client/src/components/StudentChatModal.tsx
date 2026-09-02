import React, { useState, useEffect, useRef } from "react";
import { X, Send, Wifi, WifiOff, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { messagesApi } from "../services/api";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import FormattedText from "./FormattedText";

interface StudentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
  counselorName: string;
}

export default function StudentChatModal({
  isOpen,
  onClose,
  appointmentId,
  counselorName,
}: StudentChatModalProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<number | null>(null);

  // Load or initialize conversation for this appointment
  useEffect(() => {
    if (!isOpen) {
      setConversationId(null);
      return;
    }

    async function initConv() {
      if (!appointmentId) return;
      try {
        setIsLoadingConv(true);
        const res = await messagesApi.getAppointmentConversation(appointmentId);
        if (res.success && res.data) {
          setConversationId(res.data.conversation_id);
          setIsChatEnabled(res.data.is_chat_enabled !== false);
        }
      } catch (err: any) {
        console.error("Failed to initialize appointment conversation:", err);
        toast.error("Could not initialize counseling chat room.");
      } finally {
        setIsLoadingConv(false);
      }
    }

    initConv();
  }, [isOpen, appointmentId]);

  const {
    messages,
    status: wsStatus,
    isOtherTyping,
    isOtherOnline,
    error: wsError,
    isLoadingHistory,
    sendMessage,
    sendTyping,
    markAsRead,
    reconnect,
  } = useChatWebSocket({
    conversationId,
    enabled: Boolean(conversationId) && isChatEnabled,
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  // Mark as read
  useEffect(() => {
    if (conversationId && isChatEnabled) {
      markAsRead();
    }
  }, [conversationId, isChatEnabled, markAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(true);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = window.setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendTyping(false);
    sendMessage(inputText.trim(), "student");
    setInputText("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18314a]/50 backdrop-blur-sm p-4">
      <div className="flex h-[600px] w-full max-w-[640px] flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1ef] bg-[#fbfdfc] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f3f0] font-bold text-[#23645f]">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] text-[#18314a]">{counselorName}</span>
                <span className="rounded-full bg-[#e6f3f0] px-2 py-0.5 text-[10px] font-bold text-[#23645f]">
                  Counseling Room
                </span>
                {isOtherOnline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f7eb] px-2 py-0.5 text-[10px] font-bold text-[#1b7a3e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#27ae60]"></span>
                    Counselor Online
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#788990]">
                <ShieldCheck size={12} className="text-[#2f9c95]" />
                Confidential session · Not visible to campus administrators
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isChatEnabled && (
              <>
                {wsStatus === "connected" ? (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#e6f3f0] px-2.5 py-1 text-[10px] font-bold text-[#23645f]">
                    <Wifi size={11} className="text-[#2f9c95]" />
                    Live
                  </span>
                ) : wsStatus === "connecting" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf0e2] px-2.5 py-1 text-[10px] font-bold text-[#b87837]">
                    <Loader2 size={11} className="animate-spin text-[#d28b47]" />
                    Connecting
                  </span>
                ) : (
                  <button
                    onClick={reconnect}
                    className="inline-flex items-center gap-1 rounded-full bg-[#fae9e7] px-2.5 py-1 text-[10px] font-bold text-[#a94e4a] hover:bg-[#f5d5d2]"
                  >
                    <WifiOff size={11} />
                    Reconnect
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#8b999d] hover:bg-[#f2f6f4] hover:text-[#18314a]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#fbfdfc]/50">
          {isLoadingConv && (
            <div className="flex items-center justify-center py-12 text-[12px] text-[#8e9fa4]">
              <Loader2 size={16} className="animate-spin mr-2 text-[#2f9c95]" />
              Initializing secure session...
            </div>
          )}

          {!isChatEnabled && !isLoadingConv && (
            <div className="my-10 rounded-2xl border border-[#fce3b8] bg-[#fffbf2] p-6 text-center text-[#9a602a]">
              <div className="font-bold text-[14px] mb-1">Appointment Pending Confirmation</div>
              <p className="text-[12px] text-[#8c6b38] leading-5 max-w-[420px] mx-auto">
                Real-time chat is activated once the counselor accepts and confirms your appointment request.
              </p>
            </div>
          )}

          {isChatEnabled && (
            <>
              {isLoadingHistory && (
                <div className="flex items-center justify-center py-4 text-[12px] text-[#8e9fa4]">
                  <Loader2 size={14} className="animate-spin mr-2 text-[#2f9c95]" />
                  Loading history...
                </div>
              )}

              {wsError && (
                <div className="rounded-xl border border-[#fae9e7] bg-[#fef5f4] p-3 text-[12px] text-[#a94e4a] flex items-center justify-between">
                  <span>{wsError}</span>
                  <button onClick={reconnect} className="font-bold underline ml-2">Retry</button>
                </div>
              )}

              {messages.length === 0 && !isLoadingHistory && !isLoadingConv && (
                <div className="py-16 text-center text-[13px] text-[#8e9fa4]">
                  You are connected to {counselorName}. Feel free to start the conversation whenever you are ready.
                </div>
              )}

              {messages.map((m) => {
                const isStudent = m.sender_role === "student" || m.sender_id === "me";
                const timeStr = m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Just now";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-[13px] leading-5 ${
                        isStudent
                          ? "bg-[#2f9c95] text-white rounded-br-xs"
                          : "bg-white text-[#18314a] border border-[#e5ece8] rounded-bl-xs shadow-xs"
                      }`}
                    >
                      <FormattedText text={m.content} isUser={isStudent} />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-[#93a2a7]">
                      <span>{timeStr}</span>
                      {isStudent && (
                        <span className="font-medium text-[#2f9c95]">
                          {m.is_read ? "· Read" : "· Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {isOtherTyping && (
                <div className="flex items-center gap-2 text-[12px] italic text-[#6e8088] animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-[#2f9c95]"></span>
                  {counselorName} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Footer Input */}
        {isChatEnabled && (
          <div className="border-t border-[#edf1ef] bg-white p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Message ${counselorName}...`}
                className="flex-1 rounded-xl border border-[#dfe6e3] bg-[#fbfdfc] px-4 py-3 text-[13px] outline-none focus:border-[#2f9c95]"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="btn btn-teal flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
