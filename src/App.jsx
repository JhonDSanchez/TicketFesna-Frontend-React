import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  Circle,
  Clock3,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Ticket as TicketIcon,
  Users,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Tickets', icon: TicketIcon },
  { label: 'Usuarios', icon: Users },
  { label: 'Áreas', icon: Building2 },
  { label: 'Reportes', icon: BarChart3 },
]

const statusPalette = {
  open: { label: 'Abierto', color: '#2563eb', bg: '#dbeafe' },
  'in-progress': { label: 'En proceso', color: '#d97706', bg: '#fef3c7' },
  resolved: { label: 'Resuelto', color: '#059669', bg: '#d1fae5' },
  closed: { label: 'Cerrado', color: '#64748b', bg: '#e2e8f0' },
}

const priorityPalette = {
  high: { label: 'Alta', color: '#b91c1c', bg: '#fee2e2' },
  medium: { label: 'Media', color: '#b45309', bg: '#fef3c7' },
  low: { label: 'Baja', color: '#047857', bg: '#d1fae5' },
}

function formatCount(value) {
  return new Intl.NumberFormat('es-CO').format(value)
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          throw new Error('No se pudo conectar con el backend')
        }

        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const tickets = data?.tickets ?? []
  const users = data?.users ?? []
  const areas = data?.areas ?? []

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return tickets
    return tickets.filter((ticket) =>
      [ticket.id, ticket.title, ticket.area, ticket.department, ticket.requester]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [search, tickets])

  const openTickets = tickets.filter((ticket) => ticket.status === 'open').length
  const inProgressTickets = tickets.filter((ticket) => ticket.status === 'in-progress').length
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'resolved').length

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandBlock}>
          <div style={styles.brandMark}>TF</div>
          <div>
            <div style={styles.brandName}>TicketFesna</div>
            <div style={styles.brandSub}>Mesa de soporte</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} style={styles.navItem} type="button">
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div style={styles.sidebarCard}>
          <div style={styles.sidebarCardLabel}>Conexión activa</div>
          <div style={styles.sidebarCardValue}>Frontend ↔ Backend</div>
          <div style={styles.sidebarCardText}>API: /api/dashboard</div>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Panel de control</h1>
            <p style={styles.subtitle}>Datos cargados desde Laravel y MySQL/MariaDB.</p>
          </div>

          <div style={styles.searchWrap}>
            <Search size={16} color="#64748b" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar tickets, áreas o usuarios"
              style={styles.searchInput}
            />
          </div>
        </header>

        {loading && <div style={styles.message}>Cargando datos del backend...</div>}
        {error && <div style={styles.error}>{error}</div>}

        {!loading && !error && data && (
          <>
            <section style={styles.statsGrid}>
              <StatCard icon={TicketIcon} label="Tickets totales" value={formatCount(tickets.length)} tone="blue" />
              <StatCard icon={Circle} label="Abiertos" value={formatCount(openTickets)} tone="indigo" />
              <StatCard icon={Clock3} label="En proceso" value={formatCount(inProgressTickets)} tone="amber" />
              <StatCard icon={ShieldCheck} label="Resueltos" value={formatCount(resolvedTickets)} tone="emerald" />
            </section>

            <section style={styles.grid2}>
              <Panel title="Tickets recientes" subtitle="Lo que sale del backend">
                <div style={styles.list}>
                  {filteredTickets.slice(0, 6).map((ticket) => {
                    const status = statusPalette[ticket.status] ?? statusPalette.open
                    const priority = priorityPalette[ticket.priority] ?? priorityPalette.medium

                    return (
                      <div key={ticket.id} style={styles.listRow}>
                        <div>
                          <div style={styles.rowTitle}>{ticket.title}</div>
                          <div style={styles.rowMeta}>
                            {ticket.id} · {ticket.area} · {ticket.requester}
                          </div>
                        </div>

                        <div style={styles.badges}>
                          <Badge label={status.label} color={status.color} bg={status.bg} />
                          <Badge label={priority.label} color={priority.color} bg={priority.bg} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>

              <Panel title="Usuario actual" subtitle="Perfil que alimenta la cabecera">
                <div style={styles.profileCard}>
                  <div style={styles.avatar}>{data.user?.initials ?? 'TF'}</div>
                  <div>
                    <div style={styles.profileName}>{data.user?.name ?? 'Usuario'}</div>
                    <div style={styles.profileMeta}>{data.user?.role ?? 'Rol'}</div>
                    <div style={styles.profileMeta}>{data.user?.department ?? 'Departamento'}</div>
                    <div style={styles.profileMeta}>{data.user?.id ?? 'ID no disponible'}</div>
                  </div>
                </div>
              </Panel>
            </section>

            <section style={styles.grid2}>
              <Panel title="Áreas" subtitle="7 áreas cargadas desde la base">
                <div style={styles.list}>
                  {areas.slice(0, 7).map((area) => (
                    <div key={area.id} style={styles.listRow}>
                      <div>
                        <div style={styles.rowTitle}>{area.name}</div>
                        <div style={styles.rowMeta}>{area.email}</div>
                      </div>
                      <div style={styles.areaCount}>{area.openTickets} abiertos</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Usuarios" subtitle="Registros sincronizados">
                <div style={styles.list}>
                  {users.slice(0, 7).map((user) => (
                    <div key={user.id} style={styles.listRow}>
                      <div>
                        <div style={styles.rowTitle}>{user.name}</div>
                        <div style={styles.rowMeta}>{user.email}</div>
                      </div>
                      <div style={styles.areaCount}>{user.role}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div style={{ ...styles.statCard, ...toneStyles[tone] }}>
      <div style={styles.statIcon}><Icon size={18} /></div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <section style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <h2 style={styles.panelTitle}>{title}</h2>
          <p style={styles.panelSubtitle}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Badge({ label, color, bg }) {
  return <span style={{ ...styles.badge, color, backgroundColor: bg }}>{label}</span>
}

const toneStyles = {
  blue: { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
  indigo: { background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' },
  amber: { background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  emerald: { background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    color: '#0f172a',
  },
  sidebar: {
    padding: '24px',
    borderRight: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(18px)',
  },
  brandBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  brandMark: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #0f172a, #334155)',
    color: '#fff',
    fontWeight: 700,
  },
  brandName: { fontSize: '1.1rem', fontWeight: 800 },
  brandSub: { fontSize: '0.85rem', color: '#64748b' },
  nav: { display: 'grid', gap: '8px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: 0,
    borderRadius: '14px',
    padding: '12px 14px',
    background: 'transparent',
    color: '#334155',
    fontSize: '0.95rem',
    textAlign: 'left',
    cursor: 'pointer',
  },
  sidebarCard: {
    marginTop: '24px',
    padding: '16px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    color: '#fff',
  },
  sidebarCardLabel: { fontSize: '0.8rem', color: '#cbd5e1' },
  sidebarCardValue: { fontSize: '1rem', fontWeight: 700, marginTop: '6px' },
  sidebarCardText: { fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' },
  main: { padding: '28px', display: 'grid', gap: '22px' },
  header: { display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' },
  title: { margin: 0, fontSize: '2rem', fontWeight: 800 },
  subtitle: { margin: '6px 0 0', color: '#64748b' },
  searchWrap: {
    minWidth: '320px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 14px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
  },
  searchInput: {
    width: '100%',
    padding: '14px 0',
    border: 0,
    outline: 'none',
    background: 'transparent',
    fontSize: '0.95rem',
  },
  message: {
    padding: '16px 18px',
    borderRadius: '16px',
    background: '#fff7ed',
    color: '#9a3412',
    border: '1px solid #fed7aa',
  },
  error: {
    padding: '16px 18px',
    borderRadius: '16px',
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
  },
  statCard: {
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255,255,255,0.7)',
    marginBottom: '14px',
  },
  statLabel: { fontSize: '0.88rem', color: '#475569' },
  statValue: { marginTop: '6px', fontSize: '1.9rem', fontWeight: 800 },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '16px',
  },
  panel: {
    borderRadius: '24px',
    padding: '20px',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 18px 44px rgba(15, 23, 42, 0.06)',
  },
  panelHeader: { marginBottom: '16px' },
  panelTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800 },
  panelSubtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
  list: { display: 'grid', gap: '12px' },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '18px',
    background: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.14)',
  },
  rowTitle: { fontWeight: 700, marginBottom: '4px' },
  rowMeta: { fontSize: '0.88rem', color: '#64748b' },
  badges: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  badge: {
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  areaCount: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#0f172a',
    whiteSpace: 'nowrap',
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #0f172a, #334155)',
    color: '#fff',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '22px',
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255,255,255,0.12)',
    fontSize: '1.1rem',
    fontWeight: 800,
  },
  profileName: { fontSize: '1.05rem', fontWeight: 800 },
  profileMeta: { fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px' },
}

export default App
