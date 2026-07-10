import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Plus,
  Save,
  Search,
  Sparkles,
  Ticket as TicketIcon,
  TrendingUp,
  X,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { allUsers, areaMembersMap, areaNames, areas, misroutedReports, PIE_COLORS, reportsData } from "../state";
import type { AreaItem, MisroutedReport, UserItem } from "../types";
import { initials } from "../utils";

export function UserEditPanel({ user, onClose, onSave }: { user: UserItem; onClose: () => void; onSave: (updated: UserItem) => void }) {
  const [form, setForm] = useState({ ...user });

  const field = (label: string, key: keyof UserItem, type = "text") => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type={type} value={form[key] as string} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[400px] bg-white h-full shadow-2xl flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
              {initials(form.name)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{form.name}</p>
              <p className="text-xs text-gray-400 font-mono">{form.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: "none" }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información Personal</p>
          {field("Cédula", "cedula")}
          {field("Nombre completo", "name")}
          {field("Correo electrónico", "email", "email")}

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Configuración de Cuenta</p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              <option>Estudiante</option>
              <option>Administrador</option>
              <option>Personal Universitario</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Área</label>
            <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              {areaNames.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
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
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
            <Save size={14} /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserCreatePanel({ onClose, onCreate }: { onClose: () => void; onCreate: (created: UserItem) => void }) {
  const [form, setForm] = useState({
    cedula: "",
    name: "",
    email: "",
    role: "Estudiante",
    department: areaNames[0] ?? "Sin área",
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo crear el usuario");
      }

      onCreate(payload as UserItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Crear usuario</p>
            <p className="text-xs text-gray-400 mt-0.5">Completa los datos para registrar un nuevo usuario</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth: "none" }}>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cédula</label>
            <input value={form.cedula} onChange={(e) => setForm((p) => ({ ...p, cedula: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre completo</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo electrónico</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              <option>Estudiante</option>
              <option>Administrador</option>
              <option>Personal Universitario</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Área</label>
            <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              {areaNames.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] text-gray-700 cursor-pointer">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-[11px] text-gray-400">La contraseña temporal será la cédula y el usuario deberá cambiarla al iniciar sesión.</p>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
            <Save size={14} /> {saving ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersView({ dataVersion, currentRole }: { dataVersion: number; currentRole: string }) {
  const [users, setUsers] = useState<UserItem[]>(allUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const canResetPasswords = currentRole === "Administrador";

  useEffect(() => {
    setUsers(allUsers);
  }, [dataVersion]);

  const roleColor: Record<string, string> = {
    Administrador: "text-purple-700 bg-purple-50",
    "Personal Universitario": "text-blue-700 bg-blue-50",
    Estudiante: "text-gray-700 bg-gray-100",
  };

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const resetPassword = async (user: UserItem) => {
    setStatusMessage("");
    setResettingUserId(user.id);
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorRole: currentRole }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo restablecer la contraseña");
      }

      setStatusMessage(`Contraseña restablecida para ${user.name}. Temporal: su cédula.`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "No se pudo restablecer la contraseña");
    } finally {
      setResettingUserId(null);
    }
  };

  return (
    <div className="p-8">
      {selectedUser && (
        <UserEditPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={async (updated) => {
            const response = await fetch(`/api/users/${updated.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });

            if (!response.ok) {
              return;
            }

            const saved: UserItem = await response.json();
            setUsers((p) => {
              const next = p.map((u) => (u.id === saved.id ? saved : u));
              allUsers.splice(0, allUsers.length, ...next);
              return next;
            });
            setSelectedUser(null);
          }}
        />
      )}
      {showCreateUser && (
        <UserCreatePanel
          onClose={() => setShowCreateUser(false)}
          onCreate={(created) => {
            setUsers((prev) => {
              const next = [created, ...prev];
              allUsers.splice(0, allUsers.length, ...next);
              return next;
            });
            setShowCreateUser(false);
            setStatusMessage(`Usuario ${created.name} creado correctamente.`);
          }}
        />
      )}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuarios — haz clic en uno para editar</p>
        </div>
        <button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
          <Plus size={15} /> Crear usuario
        </button>
      </div>
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuarios..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all" />
        </div>
        {statusMessage && <p className="text-xs text-gray-600 mt-2">{statusMessage}</p>}
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
              {canResetPasswords && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => (
              <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-blue-50/40 transition-colors cursor-pointer group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                      {initials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-[#1B3F7A] transition-colors">{user.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-4"><span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${roleColor[user.role] ?? "text-gray-600 bg-gray-100"}`}>{user.role}</span></td>
                <td className="px-4 py-4 text-sm text-gray-600">{user.department}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === "active" ? "text-emerald-600" : "text-gray-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {canResetPasswords && (
                  <td className="px-4 py-4">
                    <button onClick={(event) => { event.stopPropagation(); resetPassword(user); }} disabled={resettingUserId === user.id} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                      {resettingUserId === user.id ? "Restableciendo..." : "Restablecer contraseña"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AreasView() {
  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null);

  if (selectedArea) {
    const activeEmails = new Set(
      allUsers
        .filter((user) => user.status === "active")
        .map((user) => user.email.toLowerCase())
    );
    const members = (areaMembersMap[selectedArea.id] ?? []).filter((member) => activeEmails.has(member.email.toLowerCase()));
    return (
      <div className="p-8">
        <button onClick={() => setSelectedArea(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B3F7A] mb-6 transition-colors">
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
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: m.role === "Jefe de Área" ? "linear-gradient(135deg,#F47920 0%,#e56c10 100%)" : "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
                        {initials(m.name)}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${m.role === "Jefe de Área" ? "text-orange-700 bg-orange-50" : m.role === "Personal Universitario" ? "text-blue-700 bg-blue-50" : "text-gray-700 bg-gray-100"}`}>{m.role}</span>
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
          <div key={area.id} onClick={() => setSelectedArea(area)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#1B3F7A]/30 hover:shadow-md transition-all cursor-pointer group">
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

export function ReportsView() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [backendReports, setBackendReports] = useState<MisroutedReport[]>([]);
  const [reportsRevision, setReportsRevision] = useState(0);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [reportsFeedback, setReportsFeedback] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await fetch("/api/reports/misrouted");
        if (!response.ok) return;

        const payload = await response.json();
        if (!Array.isArray(payload)) return;

        const parsed = payload.map((report) => ({
          id: String(report.id ?? ""),
          ticketId: String(report.ticketId ?? ""),
          ticketTitle: String(report.ticketTitle ?? "Sin título"),
          reportingUser: String(report.reportingUser ?? "Funcionario"),
          userArea: String(report.userArea ?? "Área desconocida"),
          correctArea: String(report.correctArea ?? "Área desconocida"),
          reason: String(report.reason ?? ""),
          date: String(report.date ?? new Date().toISOString()),
        })) as MisroutedReport[];

        setBackendReports(parsed);
      } catch {
        setBackendReports([]);
      }
    };

    loadReports();
  }, []);

  const allReports = useMemo(() => {
    const ids = new Set(misroutedReports.map((report) => report.id));
    const appended = backendReports.filter((report) => !ids.has(report.id));
    return [...misroutedReports, ...appended];
  }, [backendReports, reportsRevision]);

  const handleDiscardReport = async (report: MisroutedReport) => {
    setReportsFeedback("");
    const confirmed = window.confirm("¿Está seguro de descartar este reporte? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    setDeletingReportId(report.id);
    try {
      const response = await fetch(`/api/reports/misrouted/${encodeURIComponent(report.id)}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo descartar el reporte");
      }

      setBackendReports((prev) => prev.filter((item) => item.id !== report.id));

      const indexInStatic = misroutedReports.findIndex((item) => item.id === report.id);
      if (indexInStatic >= 0) {
        misroutedReports.splice(indexInStatic, 1);
        setReportsRevision((value) => value + 1);
      }

      if (expandedReport === report.id) {
        setExpandedReport(null);
      }

      setReportsFeedback(payload?.message ?? "Reporte descartado correctamente.");
    } catch (error) {
      setReportsFeedback(error instanceof Error ? error.message : "No se pudo descartar el reporte");
    } finally {
      setDeletingReportId(null);
    }
  };

  const total = reportsData.byMonth.reduce((a, b) => a + b.tickets, 0);
  const resolved = reportsData.byMonth.reduce((a, b) => a + b.resolved, 0);
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const lastAcc = reportsData.aiAccuracy.length > 0 ? reportsData.aiAccuracy[reportsData.aiAccuracy.length - 1].accuracy : 0;

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
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"><FileText size={14} /> Exportar PDF</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#EEF3FB] flex items-center justify-center"><kpi.icon size={17} className="text-[#1B3F7A]" /></div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.positive ? "text-emerald-600" : "text-gray-400"}`}>{kpi.positive && <ArrowUpRight size={12} />}{kpi.sub}</span>
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
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} /><span className="text-xs text-gray-600">{cat.name}</span></div>
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
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><TrendingUp size={14} />{lastAcc}% esta semana</span>
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
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle size={16} className="text-red-500" /></div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Reportes de Tickets Mal Direccionados</h2>
            <p className="text-xs text-gray-500">Solicitudes donde la IA asignó incorrectamente el área destino</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{allReports.length} reportes</span>
        </div>
        {reportsFeedback && <p className="text-xs text-gray-600 mb-3">{reportsFeedback}</p>}

        <div className="space-y-3">
          {allReports.map((report) => {
            const isOpen = expandedReport === report.id;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedReport(isOpen ? null : report.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0"><AlertTriangle size={15} className="text-red-500" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Fallo de Ticket en {report.userArea}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{report.ticketTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">{new Date(report.date).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>{initials(report.reportingUser)}</div>
                            <p className="text-sm text-gray-800 font-medium">{report.reportingUser}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Área del usuario</p>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">{report.userArea}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha del reporte</p>
                          <p className="text-sm text-gray-700">{new Date(report.date).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
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
                      <button
                        onClick={() => handleDiscardReport(report)}
                        disabled={deletingReportId === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        <X size={12} /> {deletingReportId === report.id ? "Descartando..." : "Descartar reporte"}
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
