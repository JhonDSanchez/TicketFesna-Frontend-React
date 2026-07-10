import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bot, Ticket as TicketIcon, Inbox, Users, Building2, BarChart3,
  LogOut, ChevronDown, ChevronRight
} from "lucide-react";
import {
  AIChatView,
  TicketSupportChatView,
  TicketsView,
  InboxView,
  AreaInboxView,
  UsersView,
  AreasView,
  ReportsView,
} from "../views";
import { NavItem } from "../ui";
import { appState, allTickets, currentUser, myTickets, staffAreaInbox } from "../state";
import type { AuthUser, TicketItem } from "../types";

type AppViewRouterProps = {
  authUser: AuthUser;
  dataVersion: number;
  dataError: string | null;
  staffInboxCount: number;
  onStaffInboxCountChange: (count: number) => void;
  onLogout: () => void;
};

function decodeTicketParam(param: string | undefined): string {
  if (!param) return "";
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

function findTicketById(ticketId: string): TicketItem | null {
  const pool = [...myTickets, ...allTickets, ...staffAreaInbox];
  for (const ticket of pool) {
    if (ticket.id === ticketId) return ticket;
  }
  return null;
}

function TicketDetailRoute({ onBack }: { onBack: () => void }) {
  const { ticketId } = useParams();
  const resolvedId = decodeTicketParam(ticketId);
  const ticket = findTicketById(resolvedId);

  if (!ticket) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-900">Ticket no encontrado</h1>
          <p className="text-sm text-gray-500 mt-1">El ticket solicitado no existe o ya no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <TicketSupportChatView
      ticket={ticket}
      onBack={onBack}
      currentUserId={currentUser.rawId}
      currentUserRole={currentUser.role}
      currentUserInitials={currentUser.initials}
    />
  );
}

export function AppViewRouter({
  authUser,
  dataVersion,
  dataError,
  staffInboxCount,
  onStaffInboxCountChange,
  onLogout,
}: AppViewRouterProps) {
  const [ticketsOpen, setTicketsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = authUser.role === "Administrador";
  const canSeeAreaInbox = authUser.role !== "Estudiante";
  const currentPath = location.pathname;
  const inTicketsSection = currentPath === "/tickets" || currentPath.startsWith("/tickets/");
  const shouldHideDepartment =
    currentUser.role === "Estudiante" &&
    ["Sin área", "Sin area", ""].includes((currentUser.department ?? "").trim());
  const profileSubtitle = shouldHideDepartment ? currentUser.role : `${currentUser.role} · ${currentUser.department}`;

  const selectedTicketId = useMemo(() => {
    const match = currentPath.match(/^\/tickets\/(.+)$/);
    return match ? decodeTicketParam(match[1]) : null;
  }, [currentPath]);

  const goTo = (path: string) => {
    if (currentPath !== path) {
      navigate(path);
    }
  };

  const handleTicketClick = (ticket: TicketItem) => {
    navigate(`/tickets/${encodeURIComponent(ticket.id)}`);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate("/ai", { replace: true });
  };

  const handleTicketBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/tickets", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <aside className="flex-shrink-0 w-[260px] flex flex-col h-full" style={{ background: "linear-gradient(180deg,#1B3F7A 0%,#163369 100%)" }}>
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" }}>
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
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" }}>
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{currentUser.name}</p>
              <p className="text-white/55 text-xs truncate">{profileSubtitle}</p>
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
          <NavItem icon={Bot} label="Asistente IA" active={currentPath === "/ai"} onClick={() => goTo("/ai")} />
          <div className="pt-3 pb-1"><p className="text-white/30 text-[10px] uppercase tracking-widest px-3.5">Mis Solicitudes</p></div>
          <button onClick={() => { setTicketsOpen((p) => !p); if (!inTicketsSection) goTo("/tickets"); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${inTicketsSection ? "bg-white/15 text-white" : "text-white/65 hover:text-white hover:bg-white/10"}`}>
            <TicketIcon size={16} className={inTicketsSection ? "text-white" : "text-white/60"} />
            <span className="flex-1 text-left">Mis Tickets</span>
            <span className="text-xs text-white/40 mr-1">{myTickets.length}</span>
            {ticketsOpen ? <ChevronDown size={13} className="text-white/40" /> : <ChevronRight size={13} className="text-white/40" />}
          </button>
          {ticketsOpen && (
            <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
              {myTickets.slice(0, 4).map((ticket) => (
                <button key={ticket.id} onClick={() => navigate(`/tickets/${encodeURIComponent(ticket.id)}`)} className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group ${selectedTicketId === ticket.id ? "bg-white/15" : "hover:bg-white/8"}`}>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${ticket.status === "open" ? "bg-blue-400" : ticket.status === "in-progress" ? "bg-amber-400" : ticket.status === "resolved" ? "bg-emerald-400" : "bg-white/25"}`} />
                  <span className={`text-xs leading-tight transition-colors line-clamp-2 ${selectedTicketId === ticket.id ? "text-white" : "text-white/55 group-hover:text-white/80"}`}>{ticket.title}</span>
                </button>
              ))}
              <button onClick={() => goTo("/tickets")} className="w-full text-left px-3 py-2 text-[11px] text-white/35 hover:text-white/55 transition-colors">Ver todos →</button>
            </div>
          )}

          {canSeeAreaInbox && (
            <>
              <div className="pt-3 pb-1"><p className="text-white/30 text-[10px] uppercase tracking-widest px-3.5">Personal</p></div>
              <NavItem icon={Inbox} label="Bandeja del Área" active={currentPath === "/inbox"} onClick={() => goTo("/inbox")} badge={staffInboxCount} />
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1"><p className="text-white/30 text-[10px] uppercase tracking-widest px-3.5">Administración</p></div>
              <NavItem icon={Inbox} label="Bandeja de Administrador" active={currentPath === "/inbox-admin"} onClick={() => goTo("/inbox-admin")} badge={allTickets.length} />
              <NavItem icon={Users} label="Gestión de Usuarios" active={currentPath === "/users"} onClick={() => goTo("/users")} />
              <NavItem icon={Building2} label="Gestión de Áreas" active={currentPath === "/areas"} onClick={() => goTo("/areas")} />
              <NavItem icon={BarChart3} label="Reportes con IA" active={currentPath === "/reports"} onClick={() => goTo("/reports")} />
            </>
          )}
        </nav>

        <div className="flex-shrink-0 px-4 pb-5 pt-2 border-t border-white/10">
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/10 text-sm transition-all">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {dataError && (
          <div className="mx-5 mt-4 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs">
            {dataError}. Se muestran datos locales temporales.
          </div>
        )}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/ai" replace />} />
            <Route path="/ai" element={<AIChatView />} />
            <Route path="/tickets" element={<TicketsView onTicketClick={handleTicketClick} />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailRoute onBack={handleTicketBack} />} />
            <Route
              path="/inbox"
              element={canSeeAreaInbox ? (
                <AreaInboxView
                  userId={authUser.rawId}
                  fallbackAreaName={appState.staffAreaName || authUser.department}
                  dataVersion={dataVersion}
                  onTicketClick={handleTicketClick}
                  onCountChange={onStaffInboxCountChange}
                />
              ) : (
                <div className="p-8">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-xl font-semibold text-gray-900">Acceso restringido</h1>
                    <p className="text-sm text-gray-500 mt-1">Tu rol no tiene permiso para ver la Bandeja del Área.</p>
                  </div>
                </div>
              )}
            />
            <Route
              path="/inbox-admin"
              element={isAdmin ? (
                <InboxView title="Bandeja de Administrador" subtitle="Todos los tickets del sistema" tickets={allTickets} enableAdminFilters onTicketClick={handleTicketClick} />
              ) : (
                <div className="p-8">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-xl font-semibold text-gray-900">Acceso restringido</h1>
                    <p className="text-sm text-gray-500 mt-1">Tu rol no tiene permiso para ver esta sección.</p>
                  </div>
                </div>
              )}
            />
            <Route path="/users" element={isAdmin ? <UsersView dataVersion={dataVersion} currentRole={authUser.role} /> : <Navigate to="/ai" replace />} />
            <Route path="/areas" element={isAdmin ? <AreasView /> : <Navigate to="/ai" replace />} />
            <Route path="/reports" element={isAdmin ? <ReportsView /> : <Navigate to="/ai" replace />} />
            <Route path="*" element={<Navigate to="/ai" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}