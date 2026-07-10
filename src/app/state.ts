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
  byArea: [] as Array<{ name: string; value: number }>,
  byMonth: [] as Array<{ month: string; tickets: number; resolved: number }>,
  aiAccuracy: [] as Array<{ week: string; accuracy: number }>,
};

export const misroutedReports: MisroutedReport[] = [];

export const PIE_COLORS = ["#1B3F7A", "#F47920", "#10B981", "#F59E0B", "#8B5CF6"];