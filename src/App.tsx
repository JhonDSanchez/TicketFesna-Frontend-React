import { useEffect, useState } from "react";
import { LoginView, ForcePasswordChangeView } from "./app/views";
import { appState, allTickets, currentUser, staffAreaAgents, staffAreaInbox } from "./app/state";
import { applyDashboardPayload, mapTicketArray } from "./app/utils";
import type { AuthUser, DashboardPayload } from "./app/types";
import { AppViewRouter } from "./app/router/AppViewRouter";
import { BotpressChat } from "./components/BotpressChat";

export default function App() {
  const [dataVersion, setDataVersion] = useState(0);
  const [dataError, setDataError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [staffInboxCount, setStaffInboxCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("ticketfesna_auth_user");
    if (!saved) return;
    try {
      const parsed: AuthUser = JSON.parse(saved);
      if (parsed.mustChangePassword) {
        localStorage.removeItem("ticketfesna_auth_user");
        return;
      }
      setAuthUser(parsed);
      Object.assign(currentUser, {
        rawId: parsed.rawId,
        name: parsed.name,
        role: parsed.role,
        department: parsed.department,
        initials: parsed.initials,
        id: parsed.id,
        email: parsed.email,
      });
      setDataVersion((value) => value + 1);
    } catch {
      localStorage.removeItem("ticketfesna_auth_user");
    }
  }, []);

  useEffect(() => {
    if (!authUser || authUser.mustChangePassword) return;

    const loadDashboard = async () => {
      try {
        setDataError(null);

        const [mineRes, usersRes, areasRes, adminTicketsRes] = await Promise.all([
          fetch(`/api/tickets/mine/${authUser.rawId}`),
          fetch("/api/users"),
          fetch("/api/areas"),
          authUser.role === "Administrador" ? fetch("/api/tickets") : Promise.resolve(null),
        ]);

        if (!mineRes.ok || !usersRes.ok || !areasRes.ok || (adminTicketsRes && !adminTicketsRes.ok)) {
          throw new Error("No se pudo cargar información del backend");
        }

        const [myTicketsPayload, users, areasPayload, adminTicketsPayload] = await Promise.all([
          mineRes.json(),
          usersRes.json(),
          areasRes.json(),
          adminTicketsRes ? adminTicketsRes.json() : Promise.resolve([]),
        ]);

        const payload: DashboardPayload = { tickets: mapTicketArray(myTicketsPayload), users, areas: areasPayload };
        applyDashboardPayload(payload, authUser);

        allTickets.splice(0, allTickets.length, ...(authUser.role === "Administrador" ? mapTicketArray(adminTicketsPayload) : mapTicketArray(myTicketsPayload)));

        if (authUser.role !== "Estudiante") {
          const staffInboxRes = await fetch(`/api/tickets/area/${authUser.rawId}`);
          if (!staffInboxRes.ok) {
            throw new Error("No se pudo cargar la bandeja del área");
          }

          const staffInboxPayload = await staffInboxRes.json();
          const nextTickets = Array.isArray(staffInboxPayload?.tickets) ? staffInboxPayload.tickets : [];
          const nextAgents = Array.isArray(staffInboxPayload?.agents) ? staffInboxPayload.agents : [];
          const nextAreaName = String(staffInboxPayload?.areaName ?? authUser.department);
          staffAreaInbox.splice(0, staffAreaInbox.length, ...nextTickets);
          staffAreaAgents.splice(0, staffAreaAgents.length, ...nextAgents);
          appState.staffAreaName = nextAreaName;
          setStaffInboxCount(nextTickets.length);
        } else {
          staffAreaInbox.splice(0, staffAreaInbox.length);
          staffAreaAgents.splice(0, staffAreaAgents.length);
          appState.staffAreaName = "";
          setStaffInboxCount(0);
        }

        setDataVersion((value) => value + 1);
      } catch (error) {
        setDataError(error instanceof Error ? error.message : "Error de conexión con el backend");
      }
    };

    loadDashboard();
  }, [authUser]);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    Object.assign(currentUser, {
      rawId: user.rawId,
      name: user.name,
      role: user.role,
      department: user.department,
      initials: user.initials,
      id: user.id,
      email: user.email,
    });

    if (!user.mustChangePassword) {
      localStorage.setItem("ticketfesna_auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ticketfesna_auth_user");
    }

    setDataVersion((value) => value + 1);
  };

  const handlePasswordChanged = () => {
    if (!authUser) return;
    const nextUser = { ...authUser, mustChangePassword: false };
    setAuthUser(nextUser);
    localStorage.setItem("ticketfesna_auth_user", JSON.stringify(nextUser));
    setDataVersion((value) => value + 1);
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem("ticketfesna_auth_user");
    setStaffInboxCount(0);
    Object.assign(currentUser, {
      rawId: null,
      name: "Usuario",
      role: "Sin rol",
      department: "Sin área",
      initials: "US",
      id: "SIN-ID",
      email: "",
    });
  };

  if (!authUser) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <BotpressChat />
      </>
    );
  }

  if (authUser.mustChangePassword) {
    return (
      <>
        <ForcePasswordChangeView user={authUser} onComplete={handlePasswordChanged} onLogout={handleLogout} />
        <BotpressChat />
      </>
    );
  }

  return (
    <>
      <AppViewRouter
        authUser={authUser}
        dataVersion={dataVersion}
        dataError={dataError}
        staffInboxCount={staffInboxCount}
        onStaffInboxCountChange={setStaffInboxCount}
        onLogout={handleLogout}
      />
      <BotpressChat />
    </>
  );
}