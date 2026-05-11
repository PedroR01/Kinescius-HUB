# KINESCIUS HUB

## Objetivo

Plataforma SaaS para la gestión integral de un centro de kinesiología: empleados, clientes, clases, horarios, reservas/cupos, notificaciones, asistencia por QR, dashboard y reportes.

## Stack tecnológico

- Frontend: React + TypeScript + Vite + TailwindCSS + Lucide + TanStack Query + Zod
- Router: TanStack Router (alternativa soportada: React Router DOM)
- Backend: Node.js + NestJS + TypeScript
- Datos/servicios: Supabase (Postgres, Auth, Storage)

## Principios de arquitectura

- Modular Monolith con límites de dominio claros
- Clean Architecture pragmática (dependencias hacia dominio)
- API-first y contratos tipados compartidos
- Seguridad por defecto (RBAC, validación, rate limiting, auditoría)
- Evolución incremental sin sobreingeniería

## Módulos de negocio

- Auth/Access
- Employees
- Clients
- Classes
- Schedules
- Bookings/Cupos
- Attendance (QR)
- Notifications
- Reports/Analytics
- Admin

## Estructura del repositorio

- apps/web -> frontend
- apps/api -> backend
- packages/shared -> tipos/esquemas/utilidades compartidas
- packages/config -> configuración compartida (eslint/tsconfig)

## Convenciones

- TypeScript estricto
- Nombres semánticos explícitos
- Validación de DTOs y errores tipados
- PRs pequeños y revisables

## Forma de trabajo

- Scrum-lite semanal
- Ramas cortas (`feature/*`, `fix/*`)
- DoD: lint + tests mínimos + revisión + checklist de seguridad
- ADRs livianas para decisiones de arquitectura
