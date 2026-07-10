import { useState } from "react";
import type { AuthUser } from "../types";

export function LoginView({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const payload = await response.json();
      if (!payload?.user?.rawId) {
        throw new Error("Respuesta inválida del servidor");
      }

      const user: AuthUser = {
        rawId: payload.user.rawId,
        id: payload.user.id,
        name: payload.user.name,
        role: payload.user.role,
        department: payload.user.department,
        initials: payload.user.initials,
        email: payload.user.email,
        mustChangePassword: Boolean(payload.requiresPasswordChange ?? payload.user.mustChangePassword),
      };

      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-7 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h1>
          <p className="text-sm text-gray-500 mt-1">Accede con tu usuario institucional</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export function ForcePasswordChangeView({ user, onComplete, onLogout }: { user: AuthUser; onComplete: () => void; onLogout: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.rawId, password, password_confirmation: confirmPassword }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? "No se pudo actualizar la contraseña");
      }

      setSuccess("Contraseña actualizada correctamente. Redirigiendo...");
      setTimeout(() => onComplete(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-7 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cambio obligatorio de contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">{user.name}, define una nueva contraseña para continuar.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all"
          />
          <p className="text-[11px] text-gray-400 mt-1">Mínimo 8 caracteres, con letras y números.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmar nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B3F7A] focus:bg-white transition-all"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-600">{success}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onLogout} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cerrar sesión</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1B3F7A 0%,#2855a0 100%)" }}>
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
}
