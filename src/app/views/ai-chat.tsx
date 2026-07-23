import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, RefreshCw, Send } from "lucide-react";
import { currentUser } from "../state";
import type { ChatMessage } from "../types";

type AIChatMessage = ChatMessage & {
  attachments?: { name: string; url: string }[];
  options?: { label: string; value: string }[];
};

export function AIChatView() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('botpressConversationId');
  });
  const [userKey, setUserKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('botpressUserKey');
  });
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (conversationId) {
      window.localStorage.setItem('botpressConversationId', conversationId);
    } else {
      window.localStorage.removeItem('botpressConversationId');
    }
  }, [conversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (userKey) {
      window.localStorage.setItem('botpressUserKey', userKey);
    } else {
      window.localStorage.removeItem('botpressUserKey');
    }
  }, [userKey]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isTyping) return;

    const userMsg: AIChatMessage = { 
      id: Date.now().toString(), 
      role: "user", 
      content: text, 
      timestamp: new Date()
    };
    
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // El frontend llama al backend Laravel y Laravel reenvía a Botpress.
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          userId: String(currentUser.id || "user-default"),
          conversationId,
          userKey,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const providerMessage = String(payload?.providerMessage ?? "").trim();
        const backendMessage = String(payload?.message ?? "").trim();
        const reason = providerMessage || backendMessage || "Error en la conexión con Botpress";
        throw new Error(reason);
      }

      const aiResponseText = String(payload?.message ?? payload?.payload?.text ?? "").trim();
      if (!aiResponseText) {
        throw new Error("Botpress no devolvió ningún mensaje en la respuesta.");
      }
      const responseOptions = Array.isArray(payload?.payload?.options)
        ? payload.payload.options
            .filter((option: unknown): option is { label: string; value: string } => {
              if (!option || typeof option !== "object") return false;
              const candidate = option as { label?: unknown; value?: unknown };
              return typeof candidate.label === "string" && typeof candidate.value === "string";
            })
            .map((option: { label: string; value: string }) => ({
              label: option.label,
              value: option.value,
            }))
        : [];
      const nextConversationId = String(payload?.conversationId ?? conversationId ?? "");
      const nextUserKey = String(payload?.userKey ?? userKey ?? "");

      if (nextConversationId !== conversationId) {
        setConversationId(nextConversationId);
      }
      if (nextUserKey !== userKey) {
        setUserKey(nextUserKey);
      }

      const aiMsg: AIChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: aiResponseText,
        options: responseOptions,
        timestamp: new Date()
      };
      setMessages((p) => [...p, aiMsg]);

    } catch (error) {
      console.error("Fallo la conexión con la IA:", error);
      const detail = error instanceof Error ? error.message : "No se pudo comunicar con Botpress.";
      setMessages((p) => [
        ...p,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: `⚠️ **Error de conexión con Botpress:** ${detail}. Intenta de nuevo.`, 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">Asistente IA · Botpress</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">En línea</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMessages([]);
              setConversationId(null);
              setUserKey(null);
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('botpressConversationId');
                window.localStorage.removeItem('botpressUserKey');
              }
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={13} /> Nueva conversación
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg) => {
          const isAI = msg.role === "assistant";
          const lines = msg.content.split("\n");
          return (
            <div key={msg.id} className={`flex gap-4 ${isAI ? "justify-start" : "justify-end"}`}>
              {isAI && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                  <Bot size={15} className="text-white" />
                </div>
              )}
              <div className={`max-w-[70%] ${isAI ? "" : "flex flex-col items-end"}`}>
                {isAI && <p className="text-xs font-semibold text-[#1B3F7A] mb-1.5 ml-0.5">Asistente IA · Botpress</p>}
                
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isAI ? "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm" : "text-white rounded-tr-sm"
                  }`}
                  style={!isAI ? { background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" } : {}}
                >
                  {lines.map((line, i) => {
                    if (line === "") return <div key={i} className="h-2" />;
                    return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                  })}

                  {isAI && msg.options && msg.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.options.map((option) => (
                        <button
                          key={`${msg.id}-${option.value}`}
                          type="button"
                          onClick={() => sendMessage(option.value)}
                          disabled={isTyping}
                          className="px-3 py-2 rounded-lg border border-[#1B3F7A] text-[#1B3F7A] text-xs font-medium hover:bg-[#1B3F7A] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 mx-0.5">{msg.timestamp.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {!isAI && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#F47920] text-white text-xs font-bold mt-0.5">
                  {currentUser.initials}
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1B3F7A] mb-1.5 ml-0.5">Asistente IA · Botpress</p>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3.5 inline-flex items-center gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex-shrink-0 px-8 pb-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-[#1B3F7A] focus-within:shadow-md focus-within:shadow-blue-100 transition-all">
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe tu solicitud o adjunta evidencias... (Enter para enviar)"
            rows={3}
            className="w-full px-4 pt-4 pb-2 text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none outline-none leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          <div className="flex items-center justify-end px-4 pb-3">
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}
            >
              {isTyping ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}