import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Paperclip, RefreshCw, Send, Sparkles } from "lucide-react";
import { currentUser } from "../state";
import type { ChatMessage } from "../types";

type AIChatMessage = ChatMessage & {
  attachments?: { name: string; url: string }[];
};

export function AIChatView() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [archivoActual, setArchivoActual] = useState<File | null>(null);
  
  // Aquí se acumulan todos los archivos de la conversación
  const [archivosAcumulados, setArchivosAcumulados] = useState<File[]>([]); 
  
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
    if ((!text && !archivoActual) || isTyping) return;

    const localPreviewUrl = archivoActual ? URL.createObjectURL(archivoActual) : undefined;
    const userMsg: AIChatMessage = { 
      id: Date.now().toString(), 
      role: "user", 
      content: text, 
      timestamp: new Date(),
      attachments: archivoActual ? [{ name: archivoActual.name, url: localPreviewUrl! }] : undefined
    };
    
    setMessages((p) => [...p, userMsg]);
    setInput("");
    
    if (archivoActual) {
      setArchivosAcumulados(prev => [...prev, archivoActual]);
    }

    setArchivoActual(null);
    if (fileRef.current) fileRef.current.value = "";
    setIsTyping(true);

    try {
      // CONEXIÓN REAL CON LA API DE BOTPRESS
      const response = await fetch("https://webhook.botpress.cloud/748329e7-a219-4d9c-8a00-c184c5205da9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Payload estándar, ajústalo si tu flujo de Botpress espera otras variables
          payload: { text: text },
          userId: String(currentUser.id || "user-default"),
        }),
      });

      if (!response.ok) throw new Error("Error en la conexión con la IA");

      const responseData = await response.text();
      let aiResponseText = "✅ Mensaje procesado por NOVA."; 

      // Botpress a veces no devuelve el texto directamente en webhooks sincrónicos, 
      // pero si tienes configurado tu webhook para responder, aquí lo capturamos:
      if (responseData) {
        try {
          const parsed = JSON.parse(responseData);
          aiResponseText = parsed.text || parsed.message || parsed.response || JSON.stringify(parsed);
        } catch (e) {
          aiResponseText = responseData; // Si es texto plano
        }
      } else {
        // Simulamos la respuesta visual si el webhook de Botpress es asíncrono y no devuelve body
        aiResponseText = "Recibí tu mensaje, lo estoy analizando en el sistema.";
      }

      const aiMsg: AIChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: aiResponseText, 
        timestamp: new Date() 
      };
      setMessages((p) => [...p, aiMsg]);

    } catch (error) {
      console.error("Fallo la conexión con la IA:", error);
      setMessages((p) => [
        ...p,
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: "⚠️ **Error de conexión:** No pude comunicarme con los servidores de NOVA. Intenta de nuevo.", 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setIsTyping(false);
      if (messages.length >= 0) setShowGenerate(true);
    }
  }, [input, archivoActual, isTyping, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGenerate = async () => {
    try {
      const formData = new FormData();
      formData.append('userId', String(currentUser.id || 1));
      formData.append('areaId', '1');
      formData.append('title', 'Ticket generado por NOVA (IA)');
      formData.append('priority', 'Media');

      const descripcionChat = "Resumen del Chat con NOVA:\n\n" + messages.map(m => 
        (m.role === 'user' ? 'Usuario: ' : 'NOVA: ') + m.content
      ).join('\n\n');
      formData.append('description', descripcionChat);

      archivosAcumulados.forEach(file => {
        formData.append('archivos[]', file);
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setGenerated(true);
        setShowGenerate(false);
        setMessages((p) => [
          ...p,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `✅ **¡Ticket generado exitosamente!**\n\n**ID:** ${data.id}\n**Área:** ${data.area}\n**Prioridad:** ${data.priorityDb}\n\nSe ha guardado toda nuestra conversación y los archivos adjuntos. Te notificaremos por correo cuando haya actualizaciones.`,
            timestamp: new Date(),
          },
        ]);
      } else {
        console.error("Error del servidor al crear el ticket");
      }
    } catch (error) {
      console.error("Fallo la conexión con el servidor:", error);
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
            <h1 className="font-semibold text-gray-900 text-sm">NOVA · Asistente IA</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">En línea</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setMessages([]); setArchivosAcumulados([]); setGenerated(false); setShowGenerate(false); }}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
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
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${isAI ? "bg-gray-100 text-gray-700" : "bg-white/20 text-white"}`}>
                          <Paperclip size={12} className="flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

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
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-[#1B3F7A] focus-within:shadow-md focus-within:shadow-blue-100 transition-all">
          
          {archivoActual && (
            <div className="px-4 py-2 text-xs text-blue-700 flex items-center justify-between bg-blue-50 border-b border-gray-100 rounded-t-2xl">
              <span className="truncate flex items-center gap-1">
                📎 {archivoActual.name}
              </span>
              <button
                onClick={() => {
                  setArchivoActual(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-red-500 hover:text-red-700 font-bold px-2"
              >
                ×
              </button>
            </div>
          )}

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
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-1">
              <input 
                ref={fileRef} 
                type="file" 
                className="hidden" 
                multiple 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setArchivoActual(e.target.files[0]);
                  }
                }}
              />
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Paperclip size={16} />
              </button>
              <span className="text-xs text-gray-400">Adjuntar archivo</span>
            </div>
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !archivoActual) || isTyping}
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