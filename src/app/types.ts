export type View = "ai" | "tickets" | "inbox" | "inbox-admin" | "users" | "areas" | "reports";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SupportMessage {
  id: string;
  role: "user" | "agent" | "system";
  type?: "message" | "system";
  senderUserId?: number | null;
  senderRole?: string;
  senderName?: string | null;
  content: string;
  timestamp: Date;
  agentName?: string;
}

export interface TicketItem {
  id: string;
  title: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  statusDb?: "Nuevo" | "En proceso" | "Esperando respuesta" | "Resuelto" | "Cerrado";
  priority: "high" | "medium" | "low";
  area: string;
  areaId?: number;
  department: string;
  requester: string;
  requesterUserId?: number;
  assignedTo: string | null;
  assignedUserId?: number | null;
  priorityDb?: "Baja" | "Media" | "Alta" | "Crítica";
  date: string;
  lastUpdate: string;
}

export interface AreaAgent {
  id: number;
  name: string;
}

export interface UserItem {
  id: string;
  cedula: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  joined: string;
  mustChangePassword?: boolean;
}

export interface AreaItem {
  id: string;
  name: string;
  head: string;
  staff: number;
  openTickets: number;
  email: string;
}

export interface MisroutedReport {
  id: string;
  ticketId: string;
  ticketTitle: string;
  reportingUser: string;
  userArea: string;
  correctArea: string;
  reason: string;
  date: string;
}

export type CurrentUserState = {
  rawId: number | null;
  name: string;
  role: string;
  department: string;
  initials: string;
  id: string;
  email: string;
};

export type DashboardPayload = {
  user?: {
    name?: string;
    role?: string;
    department?: string;
    initials?: string;
    id?: string;
  };
  tickets?: TicketItem[];
  users?: Array<{
    id: string;
    cedula: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: "active" | "inactive";
    joined: string;
  }>;
  areas?: AreaItem[];
};

export type AuthUser = {
  rawId: number;
  id: string;
  name: string;
  role: string;
  department: string;
  initials: string;
  email: string;
  mustChangePassword: boolean;
};