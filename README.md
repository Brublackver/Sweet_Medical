# 🏥 Sweet Medical

Plataforma web de gestión de turnos médicos. Trabajo práctico grupal de Desarrollo de Software (UTN FRBA), actualmente desplegado en producción.

## ¿Qué problema resuelve?

Un turno no es solo una fila en una base de datos: es una persona que quiere saber cuánto le cubre su obra social antes de reservar, o que necesita enterarse si se libera un lugar. Las decisiones técnicas del proyecto salieron de ahí.

## Funcionalidades

**Pacientes**
- Búsqueda de turnos filtrando por especialidad, sede y obra social.
- Descuento del plan aplicado en tiempo real.
- Fila de espera: si no hay disponibilidad, el paciente se anota y recibe un aviso cuando se libera un horario.

**Médicos**
- Gestión de su agenda y disponibilidad horaria.
- Gestión de solicitudes de turnos.

**Administración**
- Panel para gestionar el plantel médico y las obras sociales.

## Arquitectura

- **Backend por capas:** dominio, servicios, repositorios y controladores.
- **API REST** con Express, documentada en Swagger ([ruta de la documentación]).
- **Validación** de datos de entrada con Zod.
- **Autenticación JWT con roles** (paciente, médico y administrador), con middlewares que verifican permisos y pertenencia en cada endpoint protegido.
- **Frontend desacoplado** en Next.js y React, con foco en accesibilidad: etiquetas ARIA, navegación por teclado, contrastes verificados, diseño responsive y un linter de accesibilidad automático.
- **Base de datos:** MongoDB (MongoDB Atlas en producción).
- **Contenedores:** Docker y Docker Compose. Frontend y backend se despliegan como servicios independientes en Render.

## Stack

MongoDB · Express · React · Node.js · Next.js · Docker · Zod · JWT · Swagger · Cypress

## Estructura del repositorio

```
backend/      API (dominio, servicios, repositorios, controladores)
frontend/     Aplicación Next.js / React
cypress/      Tests end-to-end
DEPLOY.md     Guía de despliegue
Req-No-Funcionales.md   Requerimientos no funcionales
gitFlow.md    Flujo de ramas utilizado
```

## Equipo

- Maia De Blasis
- David Saghatelyan
- Boris Dvoretsky
- Bruno Verdún: 

## Aprendizajes

La parte difícil no fue el código, sino entender a quién le estábamos programando, discutir las decisiones en equipo, ceder cuando correspondía y sostener una postura cuando teníamos razón.
