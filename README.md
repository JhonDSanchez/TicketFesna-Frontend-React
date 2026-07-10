# TicketFesna Frontend

Aplicacion web de TicketFesna para gestion de solicitudes y tickets institucionales.

## Resumen

Este proyecto implementa la interfaz de usuario del sistema de tickets de FESNA. Incluye autenticacion, bandejas por rol, conversacion por ticket, gestion administrativa y flujos de reporte entre areas.

## Tecnologias

- React 19
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- TypeScript (tipado usado dentro del proyecto)
- Lucide React
- Recharts

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Backend Laravel de TicketFesna ejecutandose en http://127.0.0.1:8000

## Instalacion

```bash
npm install
```

## Variables y conexion API

No usa archivo .env para la API en desarrollo local. La conexion se hace por proxy de Vite:

- /api -> http://127.0.0.1:8000

Configurado en vite.config.js.

## Comandos utiles

```bash
# Desarrollo local
npm run dev

# Desarrollo forzando host/puerto local
npm run dev:local

# Desarrollo para red local
npm run dev:lan

# Build de produccion
npm run build

# Lint
npm run lint

# Preview del build
npm run preview
```

## Rutas principales de la app

- /ai
- /tickets
- /tickets/:ticketId
- /inbox
- /inbox-admin
- /users
- /areas
- /reports

## Modulos funcionales

- Inicio de sesion y cambio forzado de contrasena
- Asistente IA
- Mis tickets
- Chat y trazabilidad por ticket
- Bandeja de area (personal)
- Bandeja administrativa global
- Gestion de usuarios
- Gestion de areas
- Reportes de tickets mal direccionados

## Reglas funcionales destacadas

- Tickets cerrados muestran estado fijo "Cerrado".
- En tickets cerrados se conserva visualmente el nombre del responsable en "Asignado a".
- Gestion de areas no lista personal inactivo.
- El boton de "Reportar" en detalle de ticket se muestra cuando el usuario actual es el responsable del ticket.

## Estructura base

```text
ticketfesna-front-end-react/
	public/
	src/
		app/
			router/
			views/
			ui/
			state.ts
			types.ts
			utils.ts
		App.tsx
		main.jsx
		index.css
	package.json
	vite.config.js
```

## Flujo local recomendado

1. Levantar backend Laravel.
2. Ejecutar npm run dev.
3. Abrir http://localhost:5173.

## Estado actual

Proyecto en desarrollo activo con integracion frontend-backend operativa para tickets, chat, bandejas y reportes.

## Licencia

Uso academico/institucional interno.
