import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Paperclip, RefreshCw, Send, Sparkles } from "lucide-react";
import { currentUser } from "../state";
import type { ChatMessage } from "../types";
import { getAiResponse } from "../utils";

export function AIChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generated, setGenerated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1400 + Math.random() * 700));
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: getAiResponse(text), timestamp: new Date() };
    setMessages((p) => [...p, aiMsg]);
    setIsTyping(false);
    if (messages.length >= 2) setShowGenerate(true);
  }, [input, isTyping, messages.length]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGenerate = () => {
    setGenerated(true);
    setShowGenerate(false);
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "✅ **¡Ticket generado exitosamente!**\n\n**ID:** TK-2024-0896\n**Área:** Soporte TI\n**Prioridad:** Alta\n**Área asignada:** Tecnología\n**Tiempo estimado de respuesta:** 4-8 horas hábiles\n\nTe notificaremos por correo cuando haya actualizaciones. Haz seguimiento desde **Mis Tickets** en el menú lateral.\n\n¿Hay algo más en lo que pueda ayudarte?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">NOVA · Asistente IA</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">En línea</span>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw size={13} /> Nueva conversación
        </button>
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
                {isAI && <p className="text-xs font-semibold text-[#1B3F7A] mb-1.5 ml-0.5">NOVA · Asistente IA</p>}
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
              <p className="text-xs font-semibold text-[#1B3F7A] mb-1.5 ml-0.5">NOVA · Asistente IA</p>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3.5 inline-flex items-center gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {showGenerate && !generated && (
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" }}
            >
              <Sparkles size={16} /> Generar Ticket automáticamente
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex-shrink-0 px-8 pb-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#1B3F7A]/40 focus-within:border-[#1B3F7A] focus-within:shadow-md focus-within:shadow-blue-100 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe tu solicitud o problema... (Enter para enviar)"
            rows={3}
            className="w-full px-4 pt-4 pb-2 text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none outline-none leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" className="hidden" multiple />
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Paperclip size={16} />
              </button>
              <span className="text-xs text-gray-400">Adjuntar archivo</span>
            </div>
            <button
              onClick={sendMessage}
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
