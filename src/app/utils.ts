import { allTickets, allUsers, areaMembersMap, areaNames, areas, currentUser, departmentInbox, myTickets, staffAreaInbox } from "./state";
import type { AuthUser, DashboardPayload, SupportMessage, TicketItem } from "./types";

export function normalizeRole(role: string) {
  if (role === "Funcionario") return "Personal Universitario";
  return role;
}

export function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function applyDashboardPayload(payload: DashboardPayload, authenticatedUser?: AuthUser | null) {
  if (!payload) return;

  if (authenticatedUser) {
    Object.assign(currentUser, {
      rawId: authenticatedUser.rawId,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
      department: authenticatedUser.department,
      initials: authenticatedUser.initials,
      id: authenticatedUser.id,
      email: authenticatedUser.email,
    });
  } else if (payload.user) {
    const parsedId = payload.user.id ? Number.parseInt(payload.user.id.replace(/\D+/g, ""), 10) : NaN;
    Object.assign(currentUser, {
      rawId: Number.isFinite(parsedId) ? parsedId : currentUser.rawId,
      name: payload.user.name ?? currentUser.name,
      role: normalizeRole(payload.user.role ?? currentUser.role),
      department: payload.user.department ?? currentUser.department,
      initials: payload.user.initials ?? initials(payload.user.name ?? currentUser.name),
      id: payload.user.id ?? currentUser.id,
      email: currentUser.email,
    });
  }

  if (Array.isArray(payload.tickets)) {
    myTickets.splice(0, myTickets.length, ...payload.tickets);
  }

  if (Array.isArray(payload.users)) {
    const nextUsers = payload.users.map((user) => ({
      ...user,
      role: normalizeRole(user.role),
    }));
    allUsers.splice(0, allUsers.length, ...nextUsers);
  }

  if (Array.isArray(payload.areas)) {
    areas.splice(0, areas.length, ...payload.areas);
    areaNames.splice(0, areaNames.length, ...payload.areas.map((area) => area.name));
  }

  if (areas.length > 0 && allUsers.length > 0) {
    const nextMembersMap: Record<string, { name: string; role: string; email: string }[]> = {};
    for (const area of areas) {
      nextMembersMap[area.id] = allUsers
        .filter((user) => user.department === area.name)
        .map((user) => ({ name: user.name, role: user.role, email: user.email }));
    }
    Object.keys(areaMembersMap).forEach((key) => delete areaMembersMap[key]);
    Object.assign(areaMembersMap, nextMembersMap);
  }
}

export function replaceTicketInCollections(updatedTicket: TicketItem) {
  const updateList = (list: TicketItem[]) => {
    const next = list.map((ticket) => (ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket } : ticket));
    list.splice(0, list.length, ...next);
  };
  updateList(myTickets);
  updateList(allTickets);
  updateList(departmentInbox);
  updateList(staffAreaInbox);
}

export function mapTicketArray(payload: unknown): TicketItem[] {
  return Array.isArray(payload) ? payload : [];
}

const aiResponses: Record<string, string> = {
  default: "Entiendo tu consulta. ¿Podrías darme más detalles para poder ayudarte mejor? Por ejemplo, ¿cuándo ocurrió el problema y qué pasos has intentado?",
  correo: "Veo que tienes un problema con el acceso a tu correo institucional. Para ayudarte mejor, necesito saber:\n\n1. ¿Cuándo perdiste el acceso exactamente?\n2. ¿Recibes algún mensaje de error específico?\n3. ¿Has intentado restablecer tu contraseña desde el portal estudiantil?\n\nEsta información me permitirá clasificar correctamente tu solicitud y asignarla al área de Tecnología.",
  pago: "Entiendo que tienes una consulta relacionada con pagos. Para gestionar tu solicitud, necesito:\n\n1. ¿Es sobre matrícula, pensión mensual o algún otro concepto?\n2. ¿El pago fue realizado y no se ha reflejado, o tienes dudas sobre el valor?\n3. ¿Tienes el comprobante de pago a mano?\n\nCon esta información podré crear un ticket para el área de Tesorería.",
  certificado: "Perfecto, puedo ayudarte con la solicitud de un certificado. Necesito confirmar algunos datos:\n\n1. ¿Qué tipo de certificado necesitas? (matrícula, notas, graduación, etc.)\n2. ¿Para qué entidad es requerido?\n3. ¿Lo necesitas en formato físico o digital?\n\nUna vez que tenga esta información, crearé automáticamente el ticket y lo enviaré a Registro Académico.",
};

export function getAiResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("correo") || lower.includes("email") || lower.includes("contraseña") || lower.includes("acceso")) return aiResponses.correo;
  if (lower.includes("pago") || lower.includes("matrícula") || lower.includes("pensión") || lower.includes("cobro")) return aiResponses.pago;
  if (lower.includes("certificado") || lower.includes("constancia") || lower.includes("documento")) return aiResponses.certificado;
  return aiResponses.default;
}

export function getSeedMessages(ticket: TicketItem): SupportMessage[] {
  void ticket;
  return [];
}