import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Ticket as TicketIcon, Inbox, Users, Building2, BarChart3,
  LogOut, Send, Paperclip, ChevronDown, ChevronRight,
  Sparkles, Clock, CheckCircle2, Circle, Search, Plus,
  X, Loader2, FileText, TrendingUp, ArrowUpRight, Filter,
  MoreHorizontal, RefreshCw, ArrowLeft, UserCircle,
  AlertTriangle, ChevronUp, Save, ShieldCheck
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "ai" | "tickets" | "inbox" | "inbox-admin" | "users" | "areas" | "reports";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SupportMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  agentName?: string;
}

interface TicketItem {
  id: string;
  title: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "high" | "medium" | "low";
  area: string;
  department: string;
  requester: string;
  assignedTo: string | null;
  date: string;
  lastUpdate: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  joined: string;
}

interface AreaItem {
  id: string;
  name: string;
  head: string;
  staff: number;
  openTickets: number;
  email: string;
}

interface MisroutedReport {
  id: string;
  ticketId: string;
  ticketTitle: string;
  reportingUser: string;
  userArea: string;
  correctArea: string;
  reason: string;
  date: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const currentUser = {
  name: "María Rodríguez",
  role: "Estudiante",
  department: "Ingeniería de Sistemas",
  initials: "MR",
  id: "2024-12890",
};

const myTickets: TicketItem[] = [
  {
    id: "TK-2024-0891",
    title: "Problema de acceso al correo electrónico",
    status: "open",
    priority: "high",
    area: "Soporte TI",
    department: "Tecnología",
    requester: "María Rodríguez",
    assignedTo: null,
    date: "2026-06-24",
    lastUpdate: "Hace 2 horas",
  },
  {
    id: "TK-2024-0845",
    title: "Pago de matrícula",
    status: "in-progress",
    priority: "medium",
    area: "Financiero",
    department: "Tesorería",
    requester: "María Rodríguez",
    assignedTo: "Andrés López",
    date: "2026-06-20",
    lastUpdate: "Ayer",
  },
  {
    id: "TK-2024-0802",
    title: "Solicitud de certificado estudiantil",
    status: "resolved",
    priority: "low",
    area: "Secretaría",
    department: "Registro Académico",
    requester: "María Rodríguez",
    assignedTo: "Ana González",
    date: "2026-06-15",
    lastUpdate: "Hace 3 días",
  },
  {
    id: "TK-2024-0778",
    title: "Inscripción de asignaturas semestre 2026-2",
    status: "closed",
    priority: "medium",
    area: "Académico",
    department: "Registro Académico",
    requester: "María Rodríguez",
    assignedTo: "Ana González",
    date: "2026-06-01",
    lastUpdate: "Hace 1 semana",
  },
];

const departmentInbox: TicketItem[] = [
  {
    id: "TK-2024-0895",
    title: "Solicitud de homologación de materias",
    status: "open",
    priority: "high",
    area: "Académico",
    department: "Ingeniería de Sistemas",
    requester: "Carlos Pérez",
    assignedTo: null,
    date: "2026-06-25",
    lastUpdate: "Hace 30 min",
  },
  {
    id: "TK-2024-0893",
    title: "Queja sobre calificaciones del semestre",
    status: "open",
    priority: "high",
    area: "PQR",
    department: "Ingeniería de Sistemas",
    requester: "Ana González",
    assignedTo: null,
    date: "2026-06-25",
    lastUpdate: "Hace 1 hora",
  },
  {
    id: "TK-2024-0891",
    title: "Problema de acceso al correo electrónico",
    status: "in-progress",
    priority: "medium",
    area: "Soporte TI",
    department: "Ingeniería de Sistemas",
    requester: "María Rodríguez",
    assignedTo: "Carlos Mendoza",
    date: "2026-06-24",
    lastUpdate: "Hace 2 horas",
  },
  {
    id: "TK-2024-0887",
    title: "Solicitud de práctica empresarial",
    status: "in-progress",
    priority: "medium",
    area: "Académico",
    department: "Ingeniería de Sistemas",
    requester: "Luis Martínez",
    assignedTo: "Luis Martínez",
    date: "2026-06-23",
    lastUpdate: "Ayer",
  },
  {
    id: "TK-2024-0880",
    title: "Reclamo por cobro adicional en laboratorio",
    status: "resolved",
    priority: "low",
    area: "PQR",
    department: "Ingeniería de Sistemas",
    requester: "Sofía Torres",
    assignedTo: "Andrés López",
    date: "2026-06-22",
    lastUpdate: "Hace 2 días",
  },
];

const allUsers: UserItem[] = [
  { id: "USR-001", name: "Carlos Mendoza", email: "c.mendoza@nuevamerica.edu.co", role: "Administrador", department: "Tecnología", status: "active", joined: "2023-01-15" },
  { id: "USR-002", name: "Ana González", email: "a.gonzalez@nuevamerica.edu.co", role: "Personal Universitario", department: "Registro Académico", status: "active", joined: "2022-08-01" },
  { id: "USR-003", name: "Luis Martínez", email: "l.martinez@nuevamerica.edu.co", role: "Personal Universitario", department: "Ingeniería de Sistemas", status: "active", joined: "2021-02-10" },
  { id: "USR-004", name: "María Rodríguez", email: "m.rodriguez@nuevamerica.edu.co", role: "Estudiante", department: "Ingeniería de Sistemas", status: "active", joined: "2024-01-20" },
  { id: "USR-005", name: "Sofía Torres", email: "s.torres@nuevamerica.edu.co", role: "Estudiante", department: "Administración", status: "inactive", joined: "2023-07-12" },
  { id: "USR-006", name: "Andrés López", email: "a.lopez@nuevamerica.edu.co", role: "Personal Universitario", department: "Tesorería", status: "active", joined: "2022-03-05" },
];

const areaNames = [
  "Ingeniería de Sistemas",
  "Registro Académico",
  "Tesorería",
  "Bienestar Universitario",
  "Tecnología",
  "Administración",
];

const areas: AreaItem[] = [
  { id: "DEP-001", name: "Ingeniería de Sistemas", head: "Luis Martínez", staff: 12, openTickets: 8, email: "sistemas@nuevamerica.edu.co" },
  { id: "DEP-002", name: "Registro Académico", head: "Ana González", staff: 6, openTickets: 15, email: "registro@nuevamerica.edu.co" },
  { id: "DEP-003", name: "Tesorería", head: "Andrés López", staff: 4, openTickets: 6, email: "tesoreria@nuevamerica.edu.co" },
  { id: "DEP-004", name: "Bienestar Universitario", head: "Carmen Ruiz", staff: 8, openTickets: 3, email: "bienestar@nuevamerica.edu.co" },
  { id: "DEP-005", name: "Tecnología", head: "Carlos Mendoza", staff: 5, openTickets: 11, email: "ti@nuevamerica.edu.co" },
  { id: "DEP-006", name: "Administración", head: "Patricia Vega", staff: 10, openTickets: 4, email: "admin@nuevamerica.edu.co" },
];

const areaMembersMap: Record<string, { name: string; role: string; email: string }[]> = {
  "DEP-001": [
    { name: "Luis Martínez", role: "Jefe de Área", email: "l.martinez@nuevamerica.edu.co" },
    { name: "María Rodríguez", role: "Estudiante", email: "m.rodriguez@nuevamerica.edu.co" },
    { name: "Pedro Gómez", role: "Personal Universitario", email: "p.gomez@nuevamerica.edu.co" },
    { name: "Laura Vargas", role: "Estudiante", email: "l.vargas@nuevamerica.edu.co" },
  ],
  "DEP-002": [
    { name: "Ana González", role: "Jefe de Área", email: "a.gonzalez@nuevamerica.edu.co" },
    { name: "Carlos Rivera", role: "Personal Universitario", email: "c.rivera@nuevamerica.edu.co" },
    { name: "Diana Mora", role: "Personal Universitario", email: "d.mora@nuevamerica.edu.co" },
  ],
  "DEP-003": [
    { name: "Andrés López", role: "Jefe de Área", email: "a.lopez@nuevamerica.edu.co" },
    { name: "Valentina Cruz", role: "Personal Universitario", email: "v.cruz@nuevamerica.edu.co" },
  ],
  "DEP-004": [
    { name: "Carmen Ruiz", role: "Jefe de Área", email: "c.ruiz@nuevamerica.edu.co" },
    { name: "Felipe Ortiz", role: "Personal Universitario", email: "f.ortiz@nuevamerica.edu.co" },
    { name: "Isabel Reyes", role: "Personal Universitario", email: "i.reyes@nuevamerica.edu.co" },
  ],
  "DEP-005": [
    { name: "Carlos Mendoza", role: "Jefe de Área", email: "c.mendoza@nuevamerica.edu.co" },
    { name: "Tomás Herrera", role: "Personal Universitario", email: "t.herrera@nuevamerica.edu.co" },
    { name: "Natalia Suárez", role: "Personal Universitario", email: "n.suarez@nuevamerica.edu.co" },
  ],
  "DEP-006": [
    { name: "Patricia Vega", role: "Jefe de Área", email: "p.vega@nuevamerica.edu.co" },
    { name: "Rodrigo Cano", role: "Personal Universitario", email: "r.cano@nuevamerica.edu.co" },
    { name: "Sofía Torres", role: "Estudiante", email: "s.torres@nuevamerica.edu.co" },
  ],
};

const reportsData = {
  byArea: [
    { name: "Académico", value: 38 },
    { name: "PQR", value: 27 },
    { name: "Soporte TI", value: 19 },
    { name: "Financiero", value: 12 },
    { name: "Secretaría", value: 4 },
  ],
  byMonth: [
    { month: "Ene", tickets: 42, resolved: 38 },
    { month: "Feb", tickets: 58, resolved: 51 },
    { month: "Mar", tickets: 71, resolved: 65 },
    { month: "Abr", tickets: 49, resolved: 44 },
    { month: "May", tickets: 83, resolved: 76 },
    { month: "Jun", tickets: 67, resolved: 54 },
  ],
  aiAccuracy: [
    { week: "S1", accuracy: 82 },
    { week: "S2", accuracy: 85 },
    { week: "S3", accuracy: 88 },
    { week: "S4", accuracy: 91 },
    { week: "S5", accuracy: 89 },
    { week: "S6", accuracy: 93 },
  ],
};

const misroutedReports: MisroutedReport[] = [
  {
    id: "MR-001",
    ticketId: "TK-2024-0872",
    ticketTitle: "Solicitud de beca por rendimiento académico",
    reportingUser: "Carlos Pérez",
    userArea: "Ingeniería de Sistemas",
    correctArea: "Bienestar Universitario",
    reason: "El ticket fue enviado a Registro Académico, pero debía ir a Bienestar Universitario que maneja las convocatorias de becas.",
    date: "2026-06-25",
  },
  {
    id: "MR-002",
    ticketId: "TK-2024-0861",
    ticketTitle: "Error al acceder al portal de notas",
    reportingUser: "Sofía Torres",
    userArea: "Administración",
    correctArea: "Tecnología",
    reason: "La IA clasificó el ticket en Registro Académico, pero el problema es técnico y corresponde al área de Tecnología.",
    date: "2026-06-23",
  },
  {
    id: "MR-003",
    ticketId: "TK-2024-0854",
    ticketTitle: "Descuento en matrícula para hermanos",
    reportingUser: "Andrés Rojas",
    userArea: "Ingeniería de Sistemas",
    correctArea: "Tesorería",
    reason: "El ticket fue dirigido a Bienestar Universitario, pero los descuentos por convenio familiar los gestiona Tesorería.",
    date: "2026-06-20",
  },
];

const PIE_COLORS = ["#1B3F7A", "#F47920", "#10B981", "#F59E0B", "#8B5CF6"];

// ─── AI Chat simulation ───────────────────────────────────────────────────────

const aiResponses: Record<string, string> = {
  default: "Entiendo tu consulta. ¿Podrías darme más detalles para poder ayudarte mejor? Por ejemplo, ¿cuándo ocurrió el problema y qué pasos has intentado?",
  correo: "Veo que tienes un problema con el acceso a tu correo institucional. Para ayudarte mejor, necesito saber:\n\n1. ¿Cuándo perdiste el acceso exactamente?\n2. ¿Recibes algún mensaje de error específico?\n3. ¿Has intentado restablecer tu contraseña desde el portal estudiantil?\n\nEsta información me permitirá clasificar correctamente tu solicitud y asignarla al área de Tecnología.",
  pago: "Entiendo que tienes una consulta relacionada con pagos. Para gestionar tu solicitud, necesito:\n\n1. ¿Es sobre matrícula, pensión mensual o algún otro concepto?\n2. ¿El pago fue realizado y no se ha reflejado, o tienes dudas sobre el valor?\n3. ¿Tienes el comprobante de pago a mano?\n\nCon esta información podré crear un ticket para el área de Tesorería.",
  certificado: "Perfecto, puedo ayudarte con la solicitud de un certificado. Necesito confirmar algunos datos:\n\n1. ¿Qué tipo de certificado necesitas? (matrícula, notas, graduación, etc.)\n2. ¿Para qué entidad es requerido?\n3. ¿Lo necesitas en formato físico o digital?\n\nUna vez que tenga esta información, crearé automáticamente el ticket y lo enviaré a Registro Académico.",
};

function getAiResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("correo") || lower.includes("email") || lower.includes("contraseña") || lower.includes("acceso")) return aiResponses.correo;
  if (lower.includes("pago") || lower.includes("matrícula") || lower.includes("pensión") || lower.includes("cobro")) return aiResponses.pago;
  if (lower.includes("certificado") || lower.includes("constancia") || lower.includes("documento")) return aiResponses.certificado;
  return aiResponses.default;
}

const initialAIMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "¡Hola, **María**! 👋 Soy **NOVA**, tu asistente de inteligencia artificial de la Fundación de Educación Superior Nueva América.\n\nEstoy aquí para ayudarte a gestionar tus solicitudes, PQR y tickets de manera rápida y eficiente. Puedo ayudarte con:\n\n• 📋 Crear y hacer seguimiento de tickets de soporte\n• 📞 Registrar peticiones, quejas y reclamos (PQR)\n• 📄 Solicitar certificados y documentos académicos\n• 💳 Consultas sobre pagos y financiamiento\n• ℹ️ Información sobre trámites y procesos universitarios\n\n¿En qué te puedo ayudar hoy?",
    timestamp: new Date(),
  },
];

// ─── Support chat seed messages per ticket ────────────────────────────────────

function getSeedMessages(ticket: TicketItem): SupportMessage[] {
  const base: SupportMessage[] = [
    {
      id: "sys-1",
      role: "agent",
      content: `Hola **${ticket.requester.split(" ")[0]}**, soy ${ticket.assignedTo ?? "un agente"} del área de **${ticket.area}**. He revisado tu solicitud "${ticket.title}" y estoy aquí para ayudarte. ¿Podrías contarme con más detalle qué está ocurriendo?`,
      timestamp: new Date(Date.now() - 3600000),
      agentName: ticket.assignedTo ?? "Soporte",
    },
  ];
  if (ticket.status !== "open") {
    base.push({
      id: "user-1",
      role: "user",
      content: "Buenos días, gracias por atenderme. El problema ocurrió desde ayer en la mañana. Intenté ingresar varias veces pero no pude.",
      timestamp: new Date(Date.now() - 3000000),
    });
    base.push({
      id: "agent-2",
      role: "agent",
      content: "Entiendo, voy a verificar el estado de tu cuenta en el sistema. Esto podría tomar unos minutos. ¿Tienes algún mensaje de error específico que hayas visto?",
      timestamp: new Date(Date.now() - 2700000),
      agentName: ticket.assignedTo ?? "Soporte",
    });
  }
  return base;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: TicketItem["status"] }) {
  const cfg = {
    open: { label: "Abierto", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    "in-progress": { label: "En Progreso", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    resolved: { label: "Resuelto", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    closed: { label: "Cerrado", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketItem["priority"] }) {
  const cfg = {
    high: { label: "Alta", text: "text-red-600", bg: "bg-red-50" },
    medium: { label: "Media", text: "text-amber-600", bg: "bg-amber-50" },
    low: { label: "Baja", text: "text-green-600", bg: "bg-green-50" },
  }[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── AI Chat View ─────────────────────────────────────────────────────────────

function AIChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialAIMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generated, setGenerated] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleGenerate = () => {
    setGenerated(true);
    setShowGenerate(false);
    setMessages((p) => [...p, {
      id: Date.now().toString(),
      role: "assistant",
      content: "✅ **¡Ticket generado exitosamente!**\n\n**ID:** TK-2024-0896\n**Área:** Soporte TI\n**Prioridad:** Alta\n**Área asignada:** Tecnología\n**Tiempo estimado de respuesta:** 4-8 horas hábiles\n\nTe notificaremos por correo cuando haya actualizaciones. Haz seguimiento desde **Mis Tickets** en el menú lateral.\n\n¿Hay algo más en lo que pueda ayudarte?",
      timestamp: new Date(),
    }]);
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
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAI ? "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm" : "text-white rounded-tr-sm"}`}
                  style={!isAI ? { background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" } : {}}>
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
            <button onClick={handleGenerate}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" }}>
              <Sparkles size={16} /> Generar Ticket automáticamente
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex-shrink-0 px-8 pb-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#1B3F7A]/40 focus-within:border-[#1B3F7A] focus-within:shadow-md focus-within:shadow-blue-100 transition-all">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Describe tu solicitud o problema... (Enter para enviar)" rows={3}
            className="w-full px-4 pt-4 pb-2 text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none outline-none leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }} />
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" className="hidden" multiple />
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Paperclip size={16} />
              </button>
              <span className="text-xs text-gray-400">Adjuntar archivo</span>
            </div>
            <button onClick={sendMessage} disabled={!input.trim() || isTyping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
              {isTyping ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Enviar
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">NOVA puede cometer errores. Verifica información importante con la institución.</p>
      </div>
    </div>
  );
}

// ─── Ticket Support Chat View ─────────────────────────────────────────────────

function TicketSupportChatView({ ticket, onBack }: { ticket: TicketItem; onBack: () => void }) {
  const [messages, setMessages] = useState<SupportMessage[]>(() => getSeedMessages(ticket));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const agentResponses = [
    "Gracias por la información. Voy a revisar tu caso con más detalle y te responderé en breve.",
    "He escalado tu solicitud al equipo correspondiente. Recibirás una actualización en las próximas 2 horas.",
    "Entendido. ¿Podrías adjuntar una captura de pantalla del error que estás viendo?",
    "He verificado el sistema y encontré el problema. Estamos trabajando en la solución.",
  ];

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    const userMsg: SupportMessage = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const agentMsg: SupportMessage = {
      id: (Date.now() + 1).toString(),
      role: "agent",
      content: agentResponses[Math.floor(Math.random() * agentResponses.length)],
      timestamp: new Date(),
      agentName: ticket.assignedTo ?? "Soporte",
    };
    setMessages((p) => [...p, agentMsg]);
    setIsTyping(false);
  }, [input, isTyping, ticket.assignedTo]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ticket.area}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight">{ticket.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {ticket.assignedTo
                ? <>Atendido por <strong className="text-gray-700">{ticket.assignedTo}</strong> · Área de {ticket.area}</>
                : <span className="text-amber-600">Sin asignar — esperando agente disponible</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-[#F5F7FA]" style={{ scrollbarWidth: "none" }}>
        <div className="flex justify-center">
          <span className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
            Conversación iniciada el {new Date(ticket.date).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
          </span>
        </div>

        {messages.map((msg) => {
          const isAgent = msg.role === "agent";
          return (
            <div key={msg.id} className={`flex gap-3 ${isAgent ? "justify-start" : "justify-end"}`}>
              {isAgent && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                  style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                  {msg.agentName ? initials(msg.agentName) : "AG"}
                </div>
              )}
              <div className={`max-w-[65%] ${isAgent ? "" : "flex flex-col items-end"}`}>
                {isAgent && <p className="text-xs font-semibold text-[#1B3F7A] mb-1 ml-0.5">{msg.agentName ?? "Agente de Soporte"}</p>}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isAgent ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                          : "text-white rounded-tr-sm"
                }`}
                  style={!isAgent ? { background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" } : {}}>
                  <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                </div>
                <p className="text-xs text-gray-400 mt-1 mx-0.5">{msg.timestamp.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              {!isAgent && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#F47920] text-white text-xs font-bold mt-0.5">
                  {initials(ticket.requester)}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
              {ticket.assignedTo ? initials(ticket.assignedTo) : "AG"}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1B3F7A] mb-1 ml-0.5">{ticket.assignedTo ?? "Agente de Soporte"}</p>
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3.5 inline-flex items-center gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex-shrink-0 px-8 pb-6 pt-4 bg-white border-t border-gray-100">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-[#1B3F7A] focus-within:bg-white focus-within:shadow-sm transition-all">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Escribe tu mensaje al agente de soporte... (Enter para enviar)" rows={2}
            className="w-full px-4 pt-3 pb-2 text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none outline-none leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }} />
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" className="hidden" multiple />
              <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Paperclip size={15} />
              </button>
              <span className="text-xs text-gray-400">Adjuntar</span>
            </div>
            <button onClick={sendMessage} disabled={!input.trim() || isTyping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
              {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Table ─────────────────────────────────────────────────────────────

function TicketTable({ tickets, showRequester = false, onTicketClick }: {
  tickets: TicketItem[];
  showRequester?: boolean;
  onTicketClick: (t: TicketItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = tickets.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterStatus === "all" || t.status === filterStatus);
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-600 cursor-pointer">
          <option value="all">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in-progress">En Progreso</option>
          <option value="resolved">Resuelto</option>
          <option value="closed">Cerrado</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter size={14} /> Filtros
        </button>
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
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Prioridad</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Actualización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((ticket) => (
              <tr key={ticket.id} onClick={() => onTicketClick(ticket)}
                className="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                <td className="px-5 py-4">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100 transition-colors">{ticket.id}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B3F7A] transition-colors">{ticket.title}</span>
                </td>
                {showRequester && (
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1B3F7A] text-white text-xs flex items-center justify-center font-medium">
                        {initials(ticket.requester)}
                      </div>
                      <span className="text-sm text-gray-700">{ticket.requester}</span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{ticket.area}</span>
                </td>
                <td className="px-4 py-4">
                  {ticket.assignedTo
                    ? <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#1B3F7A]/10 text-[#1B3F7A] text-[10px] flex items-center justify-center font-bold">
                          {initials(ticket.assignedTo)}
                        </div>
                        <span className="text-xs text-gray-700">{ticket.assignedTo}</span>
                      </div>
                    : <span className="text-gray-300 text-sm">—</span>}
                </td>
                <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                <td className="px-4 py-4"><span className="text-xs text-gray-400">{ticket.lastUpdate}</span></td>
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

// ─── Tickets View ─────────────────────────────────────────────────────────────

function TicketsView({ onTicketClick }: { onTicketClick: (t: TicketItem) => void }) {
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
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon size={20} className={s.color} /></div>
            <div><p className="text-2xl font-bold text-gray-900">{s.count}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>
      <TicketTable tickets={myTickets} onTicketClick={onTicketClick} />
    </div>
  );
}

// ─── Inbox View ───────────────────────────────────────────────────────────────

function InboxView({ title, subtitle, tickets, onTicketClick }: {
  title: string; subtitle: string; tickets: TicketItem[]; onTicketClick: (t: TicketItem) => void;
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
      <TicketTable tickets={tickets} showRequester onTicketClick={onTicketClick} />
    </div>
  );
}

// ─── User Edit Panel ──────────────────────────────────────────────────────────

function UserEditPanel({ user, onClose, onSave }: {
  user: UserItem;
  onClose: () => void;
  onSave: (updated: UserItem) => void;
}) {
  const [form, setForm] = useState({ ...user });

  const field = (label: string, key: keyof UserItem, type = "text") => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={form[key] as string}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[400px] bg-white h-full shadow-2xl flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
              {initials(form.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{form.name}</p>
              <p className="text-xs text-gray-400 font-mono">{form.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: "none" }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información Personal</p>
          {field("Nombre completo", "name")}
          {field("Correo electrónico", "email", "email")}

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Configuración de Cuenta</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              <option>Estudiante</option>
              <option>Administrador</option>
              <option>Personal Universitario</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Área</label>
            <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              {areaNames.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="pt-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Miembro desde</label>
            <p className="text-sm text-gray-500 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">{form.joined}</p>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
            <Save size={14} /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users View ───────────────────────────────────────────────────────────────

function UsersView() {
  const [users, setUsers] = useState<UserItem[]>(allUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const roleColor: Record<string, string> = {
    Administrador: "text-purple-700 bg-purple-50",
    "Personal Universitario": "text-blue-700 bg-blue-50",
    Estudiante: "text-gray-700 bg-gray-100",
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {selectedUser && (
        <UserEditPanel user={selectedUser} onClose={() => setSelectedUser(null)}
          onSave={(updated) => {
            setUsers((p) => p.map((u) => (u.id === updated.id ? updated : u)));
            setSelectedUser(null);
          }} />
      )}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuarios — haz clic en uno para editar</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
          <Plus size={15} /> Invitar Usuario
        </button>
      </div>
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuarios..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">Usuario</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Correo</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Rol</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Área</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => (
              <tr key={user.id} onClick={() => setSelectedUser(user)}
                className="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                      {initials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-[#1B3F7A] transition-colors">{user.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${roleColor[user.role] ?? "text-gray-600 bg-gray-100"}`}>{user.role}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{user.department}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === "active" ? "text-emerald-600" : "text-gray-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Areas View ───────────────────────────────────────────────────────────────

function AreasView() {
  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null);

  if (selectedArea) {
    const members = areaMembersMap[selectedArea.id] ?? [];
    return (
      <div className="p-8">
        <button onClick={() => setSelectedArea(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B3F7A] mb-6 transition-colors">
          <ArrowLeft size={15} /> Volver a Gestión de Áreas
        </button>
        <div className="flex items-center gap-4 mb-7">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EEF3FB 0%,#dde8f7 100%)" }}>
            <Building2 size={22} className="text-[#1B3F7A]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{selectedArea.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{selectedArea.email} · {members.length} integrantes</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5">Integrante</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Rol</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Correo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.email} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: m.role === "Jefe de Área" ? "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" : "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                        {initials(m.name)}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      m.role === "Jefe de Área" ? "text-orange-700 bg-orange-50"
                        : m.role === "Personal Universitario" ? "text-blue-700 bg-blue-50"
                        : "text-gray-700 bg-gray-100"
                    }`}>{m.role}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Gestión de Áreas</h1>
        <p className="text-sm text-gray-500 mt-0.5">{areas.length} áreas configuradas — haz clic en un área para ver sus integrantes</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {areas.map((area) => (
          <div key={area.id} onClick={() => setSelectedArea(area)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#1B3F7A]/30 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EEF3FB 0%,#dde8f7 100%)" }}>
                <Building2 size={18} className="text-[#1B3F7A]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#1B3F7A] transition-colors">{area.name}</h3>
                <p className="text-xs text-gray-500">{area.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-lg font-bold text-gray-800">{area.staff}</p>
                <p className="text-xs text-gray-500">Personal</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-lg font-bold text-[#1B3F7A]">{area.openTickets}</p>
                <p className="text-xs text-blue-600">Tickets activos</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-600 truncate">{area.head.split(" ")[0]}</p>
                <p className="text-xs text-gray-400">Responsable</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────

function ReportsView() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const total = reportsData.byMonth.reduce((a, b) => a + b.tickets, 0);
  const resolved = reportsData.byMonth.reduce((a, b) => a + b.resolved, 0);
  const rate = Math.round((resolved / total) * 100);
  const lastAcc = reportsData.aiAccuracy[reportsData.aiAccuracy.length - 1].accuracy;

  const kpis = [
    { label: "Total Tickets (6 meses)", value: total, icon: TicketIcon, sub: "+12%", positive: true },
    { label: "Tasa de Resolución", value: `${rate}%`, icon: CheckCircle2, sub: "+4%", positive: true },
    { label: "Precisión IA", value: `${lastAcc}%`, icon: Sparkles, sub: "Clasificación", positive: true },
    { label: "Tiempo Promedio", value: "6.4h", icon: Clock, sub: "Resolución", positive: false },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reportes de Clasificación con IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis de rendimiento y métricas del sistema</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <FileText size={14} /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#EEF3FB] flex items-center justify-center">
                <kpi.icon size={17} className="text-[#1B3F7A]" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.positive ? "text-emerald-600" : "text-gray-400"}`}>
                {kpi.positive && <ArrowUpRight size={12} />}{kpi.sub}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Tickets por Mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reportsData.byMonth} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="tickets" name="Recibidos" fill="#1B3F7A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resueltos" fill="#F47920" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Por Área</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={reportsData.byArea} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {reportsData.byArea.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {reportsData.byArea.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-xs text-gray-600">{cat.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Precisión de Clasificación IA</h3>
            <p className="text-xs text-gray-400 mt-0.5">Evolución semanal del modelo de inteligencia artificial</p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <TrendingUp size={14} />{lastAcc}% esta semana
          </span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={reportsData.aiAccuracy}>
            <defs>
              <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B3F7A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1B3F7A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} formatter={(v) => [`${v}%`, "Precisión"]} />
            <Area type="monotone" dataKey="accuracy" stroke="#1B3F7A" strokeWidth={2.5} fill="url(#aiGrad)" dot={{ fill: "#1B3F7A", r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Reportes de Tickets Mal Direccionados</h2>
            <p className="text-xs text-gray-500">Solicitudes donde la IA asignó incorrectamente el área destino</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{misroutedReports.length} reportes</span>
        </div>

        <div className="space-y-3">
          {misroutedReports.map((report) => {
            const isOpen = expandedReport === report.id;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedReport(isOpen ? null : report.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={15} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Fallo de Ticket en {report.userArea}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{report.ticketTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">{new Date(report.date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{report.ticketId}</span>
                    {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usuario que reporta</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                              {initials(report.reportingUser)}
                            </div>
                            <p className="text-sm text-gray-800 font-medium">{report.reportingUser}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Área del usuario</p>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{report.userArea}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha del reporte</p>
                          <p className="text-sm text-gray-700">{new Date(report.date).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Área incorrecta (IA asignó)</p>
                          <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium">{report.userArea}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Área correcta</p>
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium">{report.correctArea}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Motivo del reporte</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{report.reason}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                        <ShieldCheck size={12} /> Usar para reentrenar IA
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <X size={12} /> Descartar reporte
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick, badge }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
        active ? "bg-white/15 text-white shadow-sm" : "text-white/65 hover:text-white hover:bg-white/10"
      }`}>
      <Icon size={16} className={active ? "text-white" : "text-white/60"} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center" style={{ background: "#F47920" }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("ai");
  const [ticketsOpen, setTicketsOpen] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  const isAdmin = true;
  const isStaff = true;

  const handleTicketClick = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
  };

  const handleBackFromTicket = () => {
    setSelectedTicket(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <aside className="flex-shrink-0 w-[260px] flex flex-col h-full"
        style={{ background: "linear-gradient(180deg,#1B3F7A 0%,#163369 100%)" }}>

        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L3 7v8l8 5 8-5V7L11 2z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2" />
                <path d="M7 11h8M11 8v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight">FESNA</p>
              <p className="text-white/50 text-[10px] leading-tight">Sistema de Tickets · PQR</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 mx-4 mt-4 mb-2 p-3.5 rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" }}>
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{currentUser.name}</p>
              <p className="text-white/55 text-xs truncate">{currentUser.role} · {currentUser.department}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-white/50 text-[10px]">Activo</span>
            <span className="text-white/25 text-[10px] ml-1">·</span>
            <span className="text-white/40 text-[10px] font-mono">{currentUser.id}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pt-2 pb-2 space-y-0.5" style={{ scrollbarWidth: "none" }}>
          <NavItem icon={Bot} label="Asistente IA" active={view === "ai" && !selectedTicket} onClick={() => { setView("ai"); setSelectedTicket(null); }} />

          <div className="pt-3 pb-1">
            <p className="text-white/30 text-[10px] uppercase tracking-widest px-3.5">Mis Solicitudes</p>
          </div>

          <button onClick={() => { setTicketsOpen((p) => !p); if (view !== "tickets") { setView("tickets"); setSelectedTicket(null); } }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              view === "tickets" ? "bg-white/15 text-white" : "text-white/65 hover:text-white hover:bg-white/10"
            }`}>
            <TicketIcon size={16} className={view === "tickets" ? "text-white" : "text-white/60"} />
            <span className="flex-1 text-left">Mis Tickets</span>
            <span className="text-xs text-white/40 mr-1">{myTickets.length}</span>
            {ticketsOpen ? <ChevronDown size={13} className="text-white/40" /> : <ChevronRight size={13} className="text-white/40" />}
          </button>

          {ticketsOpen && (
            <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
              {myTickets.slice(0, 4).map((ticket) => (
                <button key={ticket.id}
                  onClick={() => { setView("tickets"); setSelectedTicket(ticket); }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group ${
                    selectedTicket?.id === ticket.id ? "bg-white/15" : "hover:bg-white/8"
                  }`}>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    ticket.status === "open" ? "bg-blue-400"
                      : ticket.status === "in-progress" ? "bg-amber-400"
                      : ticket.status === "resolved" ? "bg-emerald-400"
                      : "bg-white/25"
                  }`} />
                  <span className={`text-xs leading-tight transition-colors line-clamp-2 ${
                    selectedTicket?.id === ticket.id ? "text-white" : "text-white/55 group-hover:text-white/80"
                  }`}>{ticket.title}</span>
                </button>
              ))}
              <button onClick={() => { setView("tickets"); setSelectedTicket(null); }}
                className="w-full text-left px-3 py-2 text-[11px] text-white/35 hover:text-white/55 transition-colors">
                Ver todos →
              </button>
            </div>
          )}

          {isStaff && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-white/30 text-[10px] uppercase tracking-widest px-3.5">Personal</p>
              </div>
              <NavItem icon={Inbox} label="Bandeja del Área" active={view === "inbox" && !selectedTicket} onClick={() => { setView("inbox"); setSelectedTicket(null); }} badge={2} />
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-white/30 text-[10px] uppercase tracking-widest px-3.5">Administración</p>
              </div>
              <NavItem icon={Inbox} label="Bandeja de Administrador" active={view === "inbox-admin" && !selectedTicket} onClick={() => { setView("inbox-admin"); setSelectedTicket(null); }} badge={5} />
              <NavItem icon={Users} label="Gestión de Usuarios" active={view === "users"} onClick={() => { setView("users"); setSelectedTicket(null); }} />
              <NavItem icon={Building2} label="Gestión de Áreas" active={view === "areas"} onClick={() => { setView("areas"); setSelectedTicket(null); }} />
              <NavItem icon={BarChart3} label="Reportes con IA" active={view === "reports"} onClick={() => { setView("reports"); setSelectedTicket(null); }} />
            </>
          )}
        </nav>

        <div className="flex-shrink-0 px-4 pb-5 pt-2 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/10 text-sm transition-all">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {selectedTicket ? (
            <TicketSupportChatView ticket={selectedTicket} onBack={handleBackFromTicket} />
          ) : (
            <>
              {view === "ai" && <AIChatView />}
              {view === "tickets" && <TicketsView onTicketClick={handleTicketClick} />}
              {view === "inbox" && (
                <InboxView title="Bandeja del Área — Ingeniería de Sistemas" subtitle="Tickets asignados a tu área"
                  tickets={departmentInbox} onTicketClick={handleTicketClick} />
              )}
              {view === "inbox-admin" && (
                <InboxView title="Bandeja de Administrador" subtitle="Todos los tickets del sistema"
                  tickets={[...myTickets, ...departmentInbox]} onTicketClick={handleTicketClick} />
              )}
              {view === "users" && <UsersView />}
              {view === "areas" && <AreasView />}
              {view === "reports" && <ReportsView />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
