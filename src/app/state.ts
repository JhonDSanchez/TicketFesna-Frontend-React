import type { AreaAgent, AreaItem, CurrentUserState, MisroutedReport, TicketItem, UserItem } from "./types";

export const currentUser: CurrentUserState = {
  rawId: null,
  name: "Usuario",
  role: "Sin rol",
  department: "Sin área",
  initials: "US",
  id: "SIN-ID",
  email: "",
};

export const myTickets: TicketItem[] = [];
export const allTickets: TicketItem[] = [];
export const departmentInbox: TicketItem[] = [];
export const staffAreaInbox: TicketItem[] = [];
export const staffAreaAgents: AreaAgent[] = [];
export const appState = {
  staffAreaName: "",
};
export const allUsers: UserItem[] = [];
export const areaNames: string[] = [];
export const areas: AreaItem[] = [];
export const areaMembersMap: Record<string, { name: string; role: string; email: string }[]> = {};

export const reportsData = {
  byArea: [
    { name: "Tecnología", value: 35 },
    { name: "Finanzas", value: 25 },
    { name: "Registraduría", value: 20 },
    { name: "Bienestar", value: 15 },
    { name: "Otros", value: 5 },
  ] as Array<{ name: string; value: number }>,
  byMonth: [
    { month: "Ene", tickets: 120, resolved: 95 },
    { month: "Feb", tickets: 145, resolved: 110 },
    { month: "Mar", tickets: 165, resolved: 128 },
    { month: "Abr", tickets: 132, resolved: 105 },
    { month: "May", tickets: 178, resolved: 145 },
    { month: "Jun", tickets: 198, resolved: 165 },
  ] as Array<{ month: string; tickets: number; resolved: number }>,
  aiAccuracy: [
    { week: "S1", accuracy: 82 },
    { week: "S2", accuracy: 85 },
    { week: "S3", accuracy: 87 },
    { week: "S4", accuracy: 89 },
    { week: "S5", accuracy: 91 },
    { week: "S6", accuracy: 93 },
  ] as Array<{ week: string; accuracy: number }>,
};

export const misroutedReports: MisroutedReport[] = [];

export const PIE_COLORS = ["#1B3F7A", "#F47920", "#10B981", "#F59E0B", "#8B5CF6"];