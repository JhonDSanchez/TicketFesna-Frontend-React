import type { ElementType } from "react";
import type { TicketItem } from "./types";

export function StatusBadge({ status }: { status: TicketItem["status"] }) {
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

export function PriorityBadge({ priority }: { priority: TicketItem["priority"] }) {
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

export function NavItem({ icon: Icon, label, active, onClick, badge }: {
  icon: ElementType; label: string; active: boolean; onClick: () => void; badge?: number;
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