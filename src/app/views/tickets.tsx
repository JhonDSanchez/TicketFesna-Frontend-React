import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Loader2,
  Paperclip,
  Search,
  Send,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { appState, areas, myTickets, staffAreaAgents, staffAreaInbox } from "../state";
import type { AreaAgent, SupportMessage, TicketItem } from "../types";
import { getSeedMessages, initials, replaceTicketInCollections } from "../utils";
import { PriorityBadge, StatusBadge } from "../ui";

type MessageAttachment = {
  name: string;
  url: string;
  downloadUrl?: string;
};

type SupportMessageWithAttachments = SupportMessage & {
  attachments?: MessageAttachment[];
};

function normalizeAttachments(raw: any): MessageAttachment[] | undefined {
  const source = raw?.attachments ?? raw?.archivos ?? raw?.files ?? null;
  if (!Array.isArray(source) || source.length === 0) return undefined;

  const list = source
    .map((item: any): MessageAttachment | null => {
      if (typeof item === "string") {
        return { name: item.split("/").pop() ?? item, url: item };
      }
      const url = item?.url ?? item?.path ?? item?.file_path ?? null;
      if (!url) return null;
      return {
        name: item?.name ?? item?.original_name ?? String(url).split("/").pop() ?? "archivo",
        url: String(url),
        downloadUrl: item?.downloadUrl ?? item?.download_url ?? undefined,
      };
    })
    .filter((item: MessageAttachment | null): item is MessageAttachment => item !== null);

  return list.length > 0 ? list : undefined;
}

function isImageAttachment(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

export function TicketSupportChatView({
  ticket,
  onBack,
  currentUserId,
  currentUserRole,
  currentUserInitials,
}: {
  ticket: TicketItem;
  onBack: () => void;
  currentUserId: number | null;
  currentUserRole: string;
  currentUserInitials: string;
}) {
  const navigate = useNavigate();
  const [ticketState, setTicketState] = useState<TicketItem>(ticket);
  const [messages, setMessages] = useState<SupportMessageWithAttachments[]>(() => getSeedMessages(ticket));
  const [input, setInput] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<"yes" | "no" | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetArea, setReportTargetArea] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState("");
  const isResponsible = currentUserId !== null && ticketState.assignedUserId === currentUserId;
  const isRequester = currentUserId !== null && ticketState.requesterUserId === currentUserId;
  const isSpectatorAgent = !isResponsible && !isRequester && currentUserRole !== "Estudiante";
  const isClosed = ticketState.status === "closed";
  const isResolved = ticketState.status === "resolved";
  const showRequesterDecision = isRequester && isResolved;
  const canChat = (isResponsible || isRequester) && !isClosed && !showRequesterDecision && !(isResponsible && isResolved);
  const requesterUserId = ticketState.requesterUserId ?? null;
  const responsibleUserId = ticketState.assignedUserId ?? null;
  const canReportTicket = isResponsible && ticketState.assignedUserId !== null;
  const reportAreaOptions = useMemo(
    () => areas.filter((area) => Number.parseInt(area.id.replace(/\D+/g, ""), 10) !== (ticketState.areaId ?? -1)),
    [ticketState.areaId]
  );

  useEffect(() => {
    setTicketState(ticket);
  }, [ticket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadMessages = useCallback(async () => {
    setLoadError("");
    try {
      const response = await fetch(`/api/tickets/${ticketState.id}/messages`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los mensajes");
      }

      const payload = await response.json();
      const mapped: SupportMessageWithAttachments[] = Array.isArray(payload)
        ? payload.map((msg: any) => ({
            id: String(msg.id),
            type: msg.type === "system" ? "system" : "message",
            role: msg.type === "system" ? "system" : msg.role === "agent" ? "agent" : "user",
            senderUserId: msg.senderUserId ?? null,
            senderRole: msg.senderRole ?? undefined,
            senderName: msg.senderName ?? msg.agentName ?? null,
            content: String(msg.content ?? ""),
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            agentName: msg.agentName ?? undefined,
            attachments: normalizeAttachments(msg),
          }))
        : [];

      setMessages(mapped);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los mensajes");
      setMessages([]);
    }
  }, [ticketState.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 🔥 NUEVO: INTEGRACIÓN DE WEBSOCKETS (LARAVEL ECHO) 🔥
  useEffect(() => {
    // Verificamos si window.Echo está disponible (definido usualmente en tu bootstrap.js)
    if (typeof window !== "undefined" && (window as any).Echo) {
      const echo = (window as any).Echo;
      
      // Nos suscribimos al canal privado del ticket
      const channel = echo.private(`ticket.${ticketState.id}`);

      // Escuchamos el evento de Laravel (ajusta 'MessageSent' según el nombre de tu evento en el backend)
      channel.listen('.MessageSent', (e: any) => {
        const newMsg = e.message || e; // Depende de cómo emitas la data en Laravel

        // Validamos que el mensaje entrante no sea del usuario que lo acaba de enviar (ya lo agregamos localmente)
        if (newMsg && newMsg.senderUserId !== currentUserId) {
          const formattedMsg: SupportMessageWithAttachments = {
            id: String(newMsg.id),
            type: newMsg.type === "system" ? "system" : "message",
            role: newMsg.role === "agent" ? "agent" : "user",
            senderUserId: newMsg.senderUserId ?? null,
            senderRole: newMsg.senderRole ?? undefined,
            senderName: newMsg.senderName ?? newMsg.agentName ?? null,
            content: String(newMsg.content ?? ""),
            timestamp: newMsg.timestamp ? new Date(newMsg.timestamp) : new Date(),
            agentName: newMsg.agentName ?? undefined,
            attachments: normalizeAttachments(newMsg),
          };

          setMessages((prev) => {
            // Filtro para evitar duplicados en la UI
            if (prev.some(m => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
        }
      });

      // Cleanup al desmontar el componente (salir del chat)
      return () => {
        echo.leave(`ticket.${ticketState.id}`);
      };
    }
  }, [ticketState.id, currentUserId]);

  useEffect(() => {
    if (!isReportOpen) return;
    setReportTargetArea((prev) => {
      if (prev && reportAreaOptions.some((area) => area.id === prev)) {
        return prev;
      }
      return reportAreaOptions[0]?.id ?? "";
    });
    setReportError("");
  }, [isReportOpen, reportAreaOptions]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && !archivo) || isTyping || !currentUserId || !canChat) return;

    setInput("");
    setArchivo(null);
    if (fileRef.current) fileRef.current.value = "";
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('userId', String(currentUserId));
      formData.append('content', text);
      if (archivo) {
        formData.append('archivos[]', archivo);
      }

      const response = await fetch(`/api/tickets/${ticketState.id}/messages`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData, 
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message ?? "No se pudo enviar el mensaje");
      }

      const created = await response.json();
      const serverAttachments = normalizeAttachments(created);
      const localPreview: MessageAttachment[] | undefined = archivo
        ? [{ name: archivo.name, url: URL.createObjectURL(archivo) }]
        : undefined;

      const userMsg: SupportMessageWithAttachments = {
        id: String(created.id),
        type: created.type === "system" ? "system" : "message",
        role: created.role === "agent" ? "agent" : "user",
        senderUserId: created.senderUserId ?? currentUserId,
        senderRole: created.senderRole ?? currentUserRole,
        senderName: created.senderName ?? null,
        content: String(created.content ?? text),
        timestamp: created.timestamp ? new Date(created.timestamp) : new Date(),
        agentName: created.agentName ?? undefined,
        attachments: serverAttachments ?? localPreview,
      };

      setMessages((p) => [...p, userMsg]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setIsTyping(false);
    }
  }, [input, archivo, isTyping, currentUserId, ticketState.id, currentUserRole, canChat]);

  const handleRequesterDecision = useCallback(
    async (solved: boolean) => {
      if (!currentUserId || !isRequester || !showRequesterDecision) return;
      setDecisionLoading(solved ? "yes" : "no");
      try {
        const response = await fetch(`/api/tickets/${ticketState.id}/requester-decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, solved }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message ?? "No se pudo actualizar el estado del ticket");
        }

        const updated: TicketItem = payload;
        setTicketState(updated);
        replaceTicketInCollections(updated);
        await loadMessages();
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "No se pudo actualizar el estado del ticket");
      } finally {
        setDecisionLoading(null);
      }
    },
    [currentUserId, isRequester, showRequesterDecision, ticketState.id, loadMessages]
  );

  const handleReportSubmit = useCallback(async () => {
    if (!currentUserId || !canReportTicket || reportLoading) return;

    const newAreaId = Number.parseInt(reportTargetArea.replace(/\D+/g, ""), 10);
    if (!Number.isFinite(newAreaId) || newAreaId <= 0) {
      setReportError("Selecciona una nueva área válida.");
      return;
    }

    const reason = reportReason.trim();
    if (reason.length < 5) {
      setReportError("Escribe un motivo más detallado para el reporte.");
      return;
    }

    setReportLoading(true);
    setReportError("");
    setReportSuccess("");

    try {
      const response = await fetch(`/api/tickets/${ticketState.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUserId: currentUserId, newAreaId, reason }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo reportar el ticket");
      }

      const updated: TicketItem | undefined = payload?.ticket;
      if (updated) {
        setTicketState(updated);
        replaceTicketInCollections(updated);
      }

      setReportSuccess(payload?.message ?? "Reporte registrado y ticket reasignado correctamente.");
      setIsReportOpen(false);
      setTimeout(() => {
        navigate("/inbox", { replace: true });
      }, 700);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "No se pudo reportar el ticket");
    } finally {
      setReportLoading(false);
    }
  }, [canReportTicket, currentUserId, navigate, reportLoading, reportReason, reportTargetArea, ticketState.id]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-start gap-4">
          <button onClick={onBack} className="mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ticketState.id}</span>
              <StatusBadge status={ticketState.status} />
              {!isRequester && <PriorityBadge priority={ticketState.priority} />}
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ticketState.area}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight">{ticketState.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {ticketState.assignedTo ? (
                <>
                  Atendido por <strong className="text-gray-700">{ticketState.assignedTo}</strong> · Área de {ticketState.area}
                </>
              ) : (
                <span className="text-amber-600">Sin asignar — esperando agente disponible</span>
              )}
            </p>
          </div>
          {canReportTicket && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="ml-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <AlertTriangle size={14} /> Reportar
            </button>
          )}
        </div>
        {reportSuccess && <p className="mt-2 text-xs text-emerald-700">{reportSuccess}</p>}
      </div>

      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsReportOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Reportar ticket a otra área</h3>
              <button onClick={() => setIsReportOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nueva Área</label>
                <select
                  value={reportTargetArea}
                  onChange={(e) => setReportTargetArea(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700"
                >
                  {reportAreaOptions.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Motivo del reporte</label>
                <textarea
                  rows={4}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe por qué este ticket debe ser atendido por otra dependencia..."
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 resize-none"
                />
              </div>

              {reportError && <p className="text-xs text-red-600">{reportError}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setIsReportOpen(false)} disabled={reportLoading} className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                  Cancelar
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={reportLoading || reportAreaOptions.length === 0}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                >
                  {reportLoading ? "Enviando..." : "Reportar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-[#F5F7FA]" style={{ scrollbarWidth: "none" }}>
        <div className="flex justify-center">
          <span className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
            Conversación iniciada el {new Date(ticketState.date).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
          </span>
        </div>

        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <div className="max-w-[85%] rounded-xl bg-gray-200/80 px-3 py-2 text-center text-xs text-gray-700">{msg.content}</div>
              </div>
            );
          }

          const isOutgoing = (() => {
            if (isRequester) {
              return requesterUserId !== null && msg.senderUserId === requesterUserId;
            }
            return requesterUserId === null ? true : msg.senderUserId !== requesterUserId;
          })();
          
          const senderName = msg.senderName ?? msg.agentName ?? (msg.role === "agent" ? "Agente de Soporte" : ticketState.requester);
          const outgoingInitials = currentUserId !== null && msg.senderUserId === currentUserId ? currentUserInitials : initials(senderName);
          
          return (
            <div key={msg.id} className={`flex gap-3 ${isOutgoing ? "justify-end" : "justify-start"}`}>
              {!isOutgoing && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                  {initials(senderName)}
                </div>
              )}
              <div className={`max-w-[65%] ${isOutgoing ? "flex flex-col items-end" : ""}`}>
                {!isOutgoing && <p className="text-xs font-semibold text-[#1B3F7A] mb-1 ml-0.5">{senderName}</p>}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isOutgoing ? "text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                  style={isOutgoing ? { background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" } : {}}
                >
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={`flex flex-col gap-2 ${msg.content ? "mb-2" : ""}`}>
                      {msg.attachments.map((att, i) => {
                        const downloadUrl = att.downloadUrl ?? att.url;
                        return (
                          <a
                            key={i}
                            href={downloadUrl}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90 ${
                              isOutgoing ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isOutgoing ? "bg-white/15" : "bg-white border border-gray-200"}`}>
                              <Paperclip size={14} />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="truncate max-w-[220px]">{att.name}</p>
                              <p className={`text-[10px] ${isOutgoing ? "text-white/70" : "text-gray-500"}`}>Descargar archivo adjunto</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {msg.content && (
                    <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 mx-0.5">{msg.timestamp.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {isOutgoing && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#F47920] text-white text-xs font-bold mt-0.5">{outgoingInitials}</div>
              )}
            </div>
          );
        })}

        {isTyping && <div className="flex justify-center text-xs text-gray-400">Enviando mensaje...</div>}
        {messages.length === 0 && !isTyping && !loadError && <div className="flex justify-center text-xs text-gray-400">No hay mensajes registrados para este ticket.</div>}
        {loadError && <div className="flex justify-center text-xs text-red-500">{loadError}</div>}
        <div ref={endRef} />
      </div>

      {!(isClosed || (isResponsible && isResolved)) && (
        <div className="flex-shrink-0 px-8 pb-6 pt-4 bg-white border-t border-gray-100">
          {showRequesterDecision ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4">
              <p className="text-sm text-gray-700 font-medium">Su solicitud fue solucionada</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleRequesterDecision(true)}
                  disabled={decisionLoading !== null}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}
                >
                  {decisionLoading === "yes" ? "Procesando..." : "Sí"}
                </button>
                <button
                  onClick={() => handleRequesterDecision(false)}
                  disabled={decisionLoading !== null}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {decisionLoading === "no" ? "Procesando..." : "No"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-[#1B3F7A] focus-within:bg-white focus-within:shadow-sm transition-all">
              {!canChat && <div className="px-4 pt-3 text-xs text-amber-700">Chat en modo lectura: solo el responsable del ticket o el solicitante pueden responder.</div>}
              
              {archivo && (
                <div className="px-4 py-2 text-xs text-blue-700 flex items-center justify-between bg-blue-50 border-t border-x border-gray-200 rounded-t-2xl">
                  <span className="truncate flex items-center gap-1">
                    📎 {archivo.name}
                  </span>
                  <button
                    onClick={() => {
                      setArchivo(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-red-500 hover:text-red-700 font-bold px-2"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={canChat ? "Escribe tu mensaje al agente de soporte... (Enter para enviar)" : "No tienes permisos para responder en este ticket"}
                rows={2}
                disabled={!canChat}
                className="w-full px-4 pt-3 pb-2 text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none outline-none leading-relaxed"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setArchivo(e.target.files[0]);
                      }
                    }}
                  />
                  <button onClick={() => fileRef.current?.click()} disabled={!canChat} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Paperclip size={15} />
                  </button>
                  <span className="text-xs text-gray-400">Adjuntar</span>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!canChat || (!input.trim() && !archivo) || isTyping}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}
                >
                  {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TicketTable({
  tickets,
  showRequester = false,
  showPriority = true,
  enableClosedToggle = false,
  enableAreaFilter = false,
  enablePriorityFilter = false,
  onTicketClick,
}: {
  tickets: TicketItem[];
  showRequester?: boolean;
  showPriority?: boolean;
  enableClosedToggle?: boolean;
  enableAreaFilter?: boolean;
  enablePriorityFilter?: boolean;
  onTicketClick: (t: TicketItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showClosedOnly, setShowClosedOnly] = useState(false);

  const areaOptions = useMemo(
    () => Array.from(new Set(tickets.map((t) => t.area).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")),
    [tickets]
  );

  const filtered = tickets.filter((t) => {
    if (enableClosedToggle) {
      if (showClosedOnly && t.status !== "closed") return false;
      if (!showClosedOnly && t.status === "closed") return false;
    }

    const normalizedSearch = search.trim().toLowerCase();
    const haystack = [t.id, t.title, t.requester, t.assignedTo ?? ""].join(" ").toLowerCase();
    const matchSearch = normalizedSearch.length === 0 || haystack.includes(normalizedSearch);
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchArea = !enableAreaFilter || filterArea === "all" || t.area === filterArea;
    const matchPriority = !enablePriorityFilter || filterPriority === "all" || t.priority === filterPriority;

    return matchSearch && matchStatus && matchArea && matchPriority;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-600 cursor-pointer"
        >
          <option value="all">Todos los estados</option>
          <option value="open">Nuevo</option>
          <option value="in-progress">En Progreso</option>
          <option value="resolved">Resuelto</option>
        </select>
        {enableAreaFilter && (
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-600 cursor-pointer"
          >
            <option value="all">Todas las áreas</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        )}
        {enablePriorityFilter && (
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-600 cursor-pointer"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        )}
        {!(enableAreaFilter || enablePriorityFilter) && (
          <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={14} /> Filtros
          </button>
        )}
        {enableClosedToggle && (
          <button onClick={() => setShowClosedOnly((prev) => !prev)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            {showClosedOnly ? "Ver tickets activos" : "Ver tickets Cerrados"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Título</th>
              {showRequester && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Solicitante</th>}
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Área</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Asignado a</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Estado</th>
              {showPriority && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Prioridad</th>}
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Actualización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((ticket) => (
              <tr key={ticket.id} onClick={() => onTicketClick(ticket)} className="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                <td className="px-5 py-4">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100 transition-colors">{ticket.id}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B3F7A] transition-colors">{ticket.title}</span>
                </td>
                {showRequester && (
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1B3F7A] text-white text-xs flex items-center justify-center font-medium">{initials(ticket.requester)}</div>
                      <span className="text-sm text-gray-700">{ticket.requester}</span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{ticket.area}</span>
                </td>
                <td className="px-4 py-4">
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1B3F7A]/10 text-[#1B3F7A] text-[10px] flex items-center justify-center font-bold">{initials(ticket.assignedTo)}</div>
                      <span className="text-xs text-gray-700">{ticket.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={ticket.status} />
                </td>
                {showPriority && (
                  <td className="px-4 py-4">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                )}
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-400">{ticket.lastUpdate}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <TicketIcon size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No se encontraron tickets</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketsView({ onTicketClick }: { onTicketClick: (t: TicketItem) => void }) {
  const sortedMyTickets = useMemo(
    () =>
      [...myTickets].sort((a, b) => {
        const aId = Number.parseInt(a.id.replace(/\D+/g, ""), 10);
        const bId = Number.parseInt(b.id.replace(/\D+/g, ""), 10);
        return bId - aId;
      }),
    [myTickets]
  );

  const stats = [
    { label: "Abiertos", count: myTickets.filter((t) => t.status === "open").length, icon: Circle, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "En Progreso", count: myTickets.filter((t) => t.status === "in-progress").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Resueltos", count: myTickets.filter((t) => t.status === "resolved").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Cerrados", count: myTickets.filter((t) => t.status === "closed").length, icon: X, color: "text-gray-500", bg: "bg-gray-100" },
  ];

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Mis Tickets</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historial y seguimiento de tus solicitudes — haz clic en un ticket para chatear</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-7">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <TicketTable tickets={sortedMyTickets} showPriority={false} onTicketClick={onTicketClick} />
    </div>
  );
}

export function InboxView({
  title,
  subtitle,
  tickets,
  enableAdminFilters = false,
  onTicketClick,
}: {
  title: string;
  subtitle: string;
  tickets: TicketItem[];
  enableAdminFilters?: boolean;
  onTicketClick: (t: TicketItem) => void;
}) {
  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in-progress").length;
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">{open} sin asignar</span>
          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">{inProgress} en progreso</span>
        </div>
      </div>
      <TicketTable
        tickets={tickets}
        showRequester
        enableClosedToggle
        enableAreaFilter={enableAdminFilters}
        enablePriorityFilter={enableAdminFilters}
        onTicketClick={onTicketClick}
      />
    </div>
  );
}

export function AreaInboxView({
  userId,
  fallbackAreaName,
  dataVersion,
  onTicketClick,
  onCountChange,
}: {
  userId: number;
  fallbackAreaName: string;
  dataVersion: number;
  onTicketClick: (t: TicketItem) => void;
  onCountChange: (count: number) => void;
}) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [agents, setAgents] = useState<AreaAgent[]>([]);
  const [areaTitle, setAreaTitle] = useState(fallbackAreaName);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignedUserId, setFilterAssignedUserId] = useState<string>("all");
  const [showClosedOnly, setShowClosedOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { assignedUserId: string; priorityDb: "Baja" | "Media" | "Alta" | "Crítica"; statusDb: "Nuevo" | "En proceso" | "Esperando respuesta" | "Resuelto" }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadAreaInbox = async () => {
      try {
        const response = await fetch(`/api/tickets/area/${userId}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar la bandeja del área");
        }

        const payload = await response.json();
        const nextTickets: TicketItem[] = Array.isArray(payload?.tickets) ? payload.tickets : [];
        const nextAgents: AreaAgent[] = Array.isArray(payload?.agents) ? payload.agents : [];
        const nextAreaName = String(payload?.areaName ?? fallbackAreaName);

        staffAreaInbox.splice(0, staffAreaInbox.length, ...nextTickets);
        staffAreaAgents.splice(0, staffAreaAgents.length, ...nextAgents);
        appState.staffAreaName = nextAreaName;

        setTickets(nextTickets);
        setAgents(nextAgents);
        setAreaTitle(nextAreaName);
        onCountChange(nextTickets.length);

        const initialDrafts: Record<string, { assignedUserId: string; priorityDb: "Baja" | "Media" | "Alta" | "Crítica"; statusDb: "Nuevo" | "En proceso" | "Esperando respuesta" | "Resuelto" }> = {};
        nextTickets.forEach((ticket) => {
          const draftStatus: "Nuevo" | "En proceso" | "Esperando respuesta" | "Resuelto" =
            ticket.statusDb === "Nuevo"
              ? "Nuevo"
              : ticket.statusDb === "Resuelto"
                ? "Resuelto"
                : ticket.statusDb === "Esperando respuesta"
                  ? "Esperando respuesta"
                  : "En proceso";
          initialDrafts[ticket.id] = {
            assignedUserId: ticket.assignedUserId ? String(ticket.assignedUserId) : "",
            priorityDb: ticket.priorityDb ?? "Media",
            statusDb: draftStatus,
          };
        });
        setDrafts(initialDrafts);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo cargar la bandeja del área");
      }
    };

    loadAreaInbox();
  }, [userId, fallbackAreaName, dataVersion, onCountChange]);

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in-progress").length;

  const filtered = tickets.filter((ticket) => {
    if (showClosedOnly && ticket.status !== "closed") return false;
    if (!showClosedOnly && ticket.status === "closed") return false;

    const normalizedSearch = search.trim().toLowerCase();
    const haystack = [ticket.id, ticket.title, ticket.requester, ticket.assignedTo ?? ""].join(" ").toLowerCase();
    const matchSearch = normalizedSearch.length === 0 || haystack.includes(normalizedSearch);
    const matchStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchAssigned =
      filterAssignedUserId === "all" ||
      (filterAssignedUserId === "unassigned" && !ticket.assignedUserId) ||
      String(ticket.assignedUserId ?? "") === filterAssignedUserId;

    return matchSearch && matchStatus && matchAssigned;
  });

  const saveRow = async (ticket: TicketItem) => {
    const draft = drafts[ticket.id];
    if (!draft) return;

    setFeedback("");
    setSavingId(ticket.id);
    try {
      const assignedUserId = draft.assignedUserId ? Number.parseInt(draft.assignedUserId, 10) : null;

      const response = await fetch(`/api/tickets/${ticket.id}/area-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorUserId: userId, assignedUserId, status: draft.statusDb, priority: draft.priorityDb }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo actualizar el ticket");
      }

      const updated: TicketItem = payload;
      setTickets((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      replaceTicketInCollections(updated);
      setFeedback(`Ticket ${updated.id} actualizado correctamente.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo actualizar el ticket");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{`Bandeja ${areaTitle}`}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tickets asignados a tu área</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">{open} sin asignar</span>
          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">{inProgress} en progreso</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-600 cursor-pointer">
          <option value="all">Todos los estados</option>
          <option value="open">Nuevo</option>
          <option value="in-progress">En Progreso</option>
          <option value="resolved">Resuelto</option>
        </select>
        <select value={filterAssignedUserId} onChange={(e) => setFilterAssignedUserId(e.target.value)} className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-600 cursor-pointer">
          <option value="all">Todos los asignados</option>
          <option value="unassigned">Sin asignar</option>
          {agents.map((agent) => (
            <option key={agent.id} value={String(agent.id)}>
              {agent.name}
            </option>
          ))}
        </select>
        <button onClick={() => setShowClosedOnly((prev) => !prev)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
          {showClosedOnly ? "Ver tickets activos" : "Ver tickets Cerrados"}
        </button>
      </div>

      {feedback && <p className="text-xs text-gray-600 mb-3">{feedback}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Título</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Solicitante</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Asignado a</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Estado</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Prioridad</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Actualización</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((ticket) => {
              const fallbackStatus: "Nuevo" | "En proceso" | "Esperando respuesta" | "Resuelto" =
                ticket.statusDb === "Nuevo"
                  ? "Nuevo"
                  : ticket.statusDb === "Resuelto"
                    ? "Resuelto"
                    : ticket.statusDb === "Esperando respuesta"
                      ? "Esperando respuesta"
                      : "En proceso";
              const draft = drafts[ticket.id] ?? {
                assignedUserId: "",
                priorityDb: (ticket.priorityDb ?? "Media") as "Baja" | "Media" | "Alta" | "Crítica",
                statusDb: fallbackStatus,
              };
              const isClosedTicket = ticket.status === "closed";
              const isResolvedTicket = ticket.status === "resolved";
              const isResponsibleForRow = ticket.assignedUserId === userId;
              const isUnassignedRow = ticket.assignedUserId === null;

              return (
                <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <button onClick={() => onTicketClick(ticket)} className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                      {ticket.id}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => onTicketClick(ticket)} className="text-sm font-medium text-gray-800 hover:text-[#1B3F7A] transition-colors text-left">
                      {ticket.title}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{ticket.requester}</td>
                  <td className="px-4 py-4">
                    {isClosedTicket ? (
                      <span className="text-xs text-gray-700 font-medium">{ticket.assignedTo ?? "Sin asignar"}</span>
                    ) : (
                      <select
                        value={draft.assignedUserId}
                        disabled={isResolvedTicket}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [ticket.id]: { ...draft, assignedUserId: e.target.value } }))}
                        className="w-full min-w-[170px] px-2.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1B3F7A] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Sin asignar</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={String(agent.id)}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {isClosedTicket ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg text-gray-700 bg-gray-100">Cerrado</span>
                    ) : (
                      <select
                        value={draft.statusDb}
                        disabled={(!isResponsibleForRow && !isUnassignedRow) || isResolvedTicket}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [ticket.id]: { ...draft, statusDb: e.target.value as "Nuevo" | "En proceso" | "Esperando respuesta" | "Resuelto" } }))}
                        className="w-full min-w-[150px] px-2.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1B3F7A] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {draft.statusDb === "Nuevo" && <option value="Nuevo">Nuevo</option>}
                        <option value="En proceso">En proceso</option>
                        <option value="Esperando respuesta">Esperando respuesta</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={draft.priorityDb}
                      disabled={!isResponsibleForRow || isClosedTicket || isResolvedTicket}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [ticket.id]: { ...draft, priorityDb: e.target.value as "Baja" | "Media" | "Alta" | "Crítica" } }))}
                      className="w-full min-w-[110px] px-2.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#1B3F7A] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-400">{ticket.lastUpdate}</span>
                  </td>
                  <td className="px-4 py-4">
                    {!isClosedTicket && !isResolvedTicket && (
                      <button onClick={() => saveRow(ticket)} disabled={savingId === ticket.id} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                        {savingId === ticket.id ? "Guardando..." : "Guardar"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <TicketIcon size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No se encontraron tickets para tu área</p>
          </div>
        )}
      </div>
    </div>
  );
}