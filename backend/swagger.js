export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title:   "Sweet Medical API",
        version: "2.0.0",
        description: "API REST para gestión de turnos médicos.",
    },
    servers: [{ url: "http://localhost:3000" }],
    tags: [
        { name: "Healthcheck" },
        { name: "Sedes" },
        { name: "Médicos" },
        { name: "Disponibilidad" },
        { name: "Servicios" },
        { name: "Pacientes" },
        { name: "Turnos" },
        { name: "Búsqueda" },
        { name: "Notificaciones" },
    ],
    paths: {

        // ── Healthcheck ────────────────────────────────────────────────────────
        "/healthcheck": {
            get: {
                tags:    ["Healthcheck"],
                summary: "Verifica que el servidor esté activo",
                responses: { 200: { description: "OK" } },
            },
        },

        // ── Sedes ──────────────────────────────────────────────────────────────
        "/sede": {
            get: {
                tags:    ["Sedes"],
                summary: "Listar todas las sedes",
                responses: { 200: { description: "Lista de sedes" } },
            },
            post: {
                tags:    ["Sedes"],
                summary: "Crear una sede",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nombre", "direccion"],
                                properties: {
                                    nombre:    { type: "string", example: "Medrano" },
                                    direccion: { type: "string", example: "Av. Medrano 950" },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Sede creada" } },
            },
        },

        // ── Médicos ────────────────────────────────────────────────────────────
        "/medico": {
            get: {
                tags:    ["Médicos"],
                summary: "Listar todos los médicos",
                responses: { 200: { description: "Lista de médicos" } },
            },
            post: {
                tags:    ["Médicos"],
                summary: "Crear un médico",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["usuario", "nombre", "matricula"],
                                properties: {
                                    usuario:   { type: "string", example: "clopez" },
                                    nombre:    { type: "string", example: "Dr. Carlos López" },
                                    matricula: { type: "string", example: "MP12345" },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Médico creado" } },
            },
        },
        "/medico/{id}": {
            get: {
                tags:    ["Médicos"],
                summary: "Obtener médico por ID",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Médico encontrado" }, 404: { description: "No encontrado" } },
            },
        },
        "/medico/{id}/sedes/{sedeId}": {
            post: {
                tags:    ["Médicos"],
                summary: "Asignar sede al médico",
                parameters: [
                    { name: "id",     in: "path", required: true, schema: { type: "integer" } },
                    { name: "sedeId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Sede asignada" } },
            },
            delete: {
                tags:    ["Médicos"],
                summary: "Quitar sede del médico",
                parameters: [
                    { name: "id",     in: "path", required: true, schema: { type: "integer" } },
                    { name: "sedeId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Sede quitada" } },
            },
        },

        // ── Disponibilidad ─────────────────────────────────────────────────────
        "/medico/{id}/disponibilidad": {
            get: {
                tags:    ["Disponibilidad"],
                summary: "Obtener disponibilidad del médico",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Disponibilidad" } },
            },
            post: {
                tags:    ["Disponibilidad"],
                summary: "Definir disponibilidad",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["fecha", "horaDesde", "horaHasta"],
                                properties: {
                                    fecha:     { type: "string", example: "2026-05-20" },
                                    horaDesde: { type: "string", example: "09:00" },
                                    horaHasta: { type: "string", example: "12:00" },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Disponibilidad definida" } },
            },
            put: {
                tags:    ["Disponibilidad"],
                summary: "Modificar disponibilidad",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["fecha", "horaDesde", "horaHasta"],
                                properties: {
                                    fecha:     { type: "string", example: "2026-05-20" },
                                    horaDesde: { type: "string", example: "10:00" },
                                    horaHasta: { type: "string", example: "13:00" },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Disponibilidad modificada" } },
            },
        },
        "/medico/{id}/disponibilidad/slots": {
            get: {
                tags:    ["Disponibilidad"],
                summary: "Consultar slots disponibles del médico",
                parameters: [
                    { name: "id",          in: "path",  required: true,  schema: { type: "integer" } },
                    { name: "fecha",       in: "query", required: true,  schema: { type: "string" }, example: "2026-05-20" },
                    { name: "especialidad", in: "query", required: false, schema: { type: "string" } },
                    { name: "practica",    in: "query", required: false, schema: { type: "string" } },
                ],
                responses: { 200: { description: "Slots disponibles" } },
            },
        },
        "/medico/{id}/disponibilidad/{disponibilidadId}": {
            get: {
                tags:    ["Disponibilidad"],
                summary: "Obtener disponibilidad por ID",
                parameters: [
                    { name: "id",               in: "path", required: true, schema: { type: "integer" } },
                    { name: "disponibilidadId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Disponibilidad" } },
            },
            delete: {
                tags:    ["Disponibilidad"],
                summary: "Eliminar disponibilidad",
                parameters: [
                    { name: "id",               in: "path", required: true, schema: { type: "integer" } },
                    { name: "disponibilidadId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Disponibilidad eliminada" } },
            },
        },

        // ── Servicios ──────────────────────────────────────────────────────────
        "/medico/{id}/especialidades": {
            post: {
                tags:    ["Servicios"],
                summary: "Agregar especialidad al médico",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["codigo", "nombre", "duracionTurnoEnMins", "costo"],
                                properties: {
                                    codigo:              { type: "string",  example: "CARD" },
                                    nombre:              { type: "string",  example: "Cardiología" },
                                    duracionTurnoEnMins: { type: "integer", example: 30 },
                                    costo:               { type: "number",  example: 5000 },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Especialidad agregada" } },
            },
        },
        "/medico/{id}/especialidades/{espId}": {
            put: {
                tags:    ["Servicios"],
                summary: "Modificar especialidad",
                parameters: [
                    { name: "id",    in: "path", required: true, schema: { type: "integer" } },
                    { name: "espId", in: "path", required: true, schema: { type: "integer" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nombre", "duracionTurnoEnMins", "costo"],
                                properties: {
                                    nombre:              { type: "string",  example: "Cardiología" },
                                    duracionTurnoEnMins: { type: "integer", example: 30 },
                                    costo:               { type: "number",  example: 5500 },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Especialidad modificada" } },
            },
            delete: {
                tags:    ["Servicios"],
                summary: "Eliminar especialidad",
                parameters: [
                    { name: "id",    in: "path", required: true, schema: { type: "integer" } },
                    { name: "espId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Especialidad eliminada" } },
            },
        },
        "/medico/{id}/practicas": {
            post: {
                tags:    ["Servicios"],
                summary: "Agregar práctica al médico",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["codigo", "nombre", "duracionTurnoEnMins", "costo"],
                                properties: {
                                    codigo:              { type: "string",  example: "ECG" },
                                    nombre:              { type: "string",  example: "Electrocardiograma" },
                                    duracionTurnoEnMins: { type: "integer", example: 15 },
                                    costo:               { type: "number",  example: 2000 },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Práctica agregada" } },
            },
        },
        "/medico/{id}/practicas/{practicaId}": {
            put: {
                tags:    ["Servicios"],
                summary: "Modificar práctica",
                parameters: [
                    { name: "id",        in: "path", required: true, schema: { type: "integer" } },
                    { name: "practicaId", in: "path", required: true, schema: { type: "integer" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nombre", "duracionTurnoEnMins", "costo"],
                                properties: {
                                    nombre:              { type: "string",  example: "Electrocardiograma" },
                                    duracionTurnoEnMins: { type: "integer", example: 15 },
                                    costo:               { type: "number",  example: 2200 },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Práctica modificada" } },
            },
            delete: {
                tags:    ["Servicios"],
                summary: "Eliminar práctica",
                parameters: [
                    { name: "id",        in: "path", required: true, schema: { type: "integer" } },
                    { name: "practicaId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Práctica eliminada" } },
            },
        },

        // ── Turnos del médico ──────────────────────────────────────────────────
        "/medico/{id}/turnos": {
            get: {
                tags:    ["Turnos"],
                summary: "Obtener turnos confirmados del médico",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Turnos con estado reservado" } },
            },
        },
        "/medico/{id}/turnos/{turnoId}/cancelar": {
            patch: {
                tags:    ["Turnos"],
                summary: "Médico cancela un turno",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["motivo"],
                                properties: { motivo: { type: "string", example: "Emergencia médica" } },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Turno cancelado" } },
            },
        },
        "/medico/{id}/turnos/{turnoId}/realizado": {
            patch: {
                tags:    ["Turnos"],
                summary: "Médico marca turno como realizado",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Turno marcado como realizado" } },
            },
        },
        "/medico/{id}/turnos/{turnoId}/proponer-cambio": {
            post: {
                tags:    ["Turnos"],
                summary: "Médico propone cambio de fecha",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nuevaFecha", "nuevaHora"],
                                properties: {
                                    nuevaFecha: { type: "string", example: "2026-05-21" },
                                    nuevaHora:  { type: "string", example: "10:00" },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Propuesta enviada" } },
            },
        },
        "/medico/{id}/turnos/{turnoId}/confirmar-cambio": {
            patch: {
                tags:    ["Turnos"],
                summary: "Médico confirma cambio solicitado por paciente",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Cambio confirmado" } },
            },
        },
        "/medico/{id}/turnos/{turnoId}/rechazar-cambio": {
            patch: {
                tags:    ["Turnos"],
                summary: "Médico rechaza cambio solicitado por paciente",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Cambio rechazado" } },
            },
        },
        "/medico/{id}/pacientes/{pacienteId}/turnos": {
            get: {
                tags:    ["Turnos"],
                summary: "Médico consulta historial de turnos de un paciente",
                parameters: [
                    { name: "id",         in: "path", required: true, schema: { type: "integer" } },
                    { name: "pacienteId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Historial de turnos" } },
            },
        },

        // ── Pacientes ──────────────────────────────────────────────────────────
        "/paciente": {
            get: {
                tags:    ["Pacientes"],
                summary: "Listar todos los pacientes",
                responses: { 200: { description: "Lista de pacientes" } },
            },
            post: {
                tags:    ["Pacientes"],
                summary: "Crear un paciente",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["usuario", "dni", "nombre", "obraSocial", "plan"],
                                properties: {
                                    usuario:    { type: "string",  example: "jperez" },
                                    dni:        { type: "string",  example: "12345678" },
                                    nombre:     { type: "string",  example: "Juan Pérez" },
                                    obraSocial: { type: "string",  example: "OSDE" },
                                    plan: {
                                        type: "object",
                                        properties: {
                                            nombre: { type: "string", example: "310" },
                                            coberturasEspecialidad: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        especialidad: { type: "object", properties: { codigo: { type: "string", example: "CARD" } } },
                                                        nivel: { type: "integer", example: 80 },
                                                    },
                                                },
                                            },
                                            coberturasPractica: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        practica: { type: "object", properties: { codigo: { type: "string", example: "ECG" } } },
                                                        nivel: { type: "integer", example: 100 },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Paciente creado" } },
            },
        },
        "/paciente/{id}": {
            get: {
                tags:    ["Pacientes"],
                summary: "Obtener paciente por ID",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Paciente encontrado" }, 404: { description: "No encontrado" } },
            },
        },
        "/paciente/{id}/turno": {
            post: {
                tags:    ["Turnos"],
                summary: "Paciente reserva un turno",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["medicoId", "fecha", "hora", "duracion"],
                                properties: {
                                    medicoId: { type: "integer", example: 1 },
                                    fecha:    { type: "string",  example: "2026-05-20" },
                                    hora:     { type: "string",  example: "09:30" },
                                    duracion: { type: "integer", example: 30 },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: "Turno reservado" } },
            },
        },
        "/paciente/{id}/turnos": {
            get: {
                tags:    ["Turnos"],
                summary: "Historial de turnos del paciente",
                parameters: [
                    { name: "id",          in: "path",  required: true,  schema: { type: "integer" } },
                    { name: "fechaDesde",  in: "query", required: false, schema: { type: "string" }, example: "2026-05-20" },
                    { name: "fechaHasta",  in: "query", required: false, schema: { type: "string" }, example: "2026-05-25" },
                ],
                responses: { 200: { description: "Historial de turnos" } },
            },
        },
        "/paciente/{id}/turnos/{turnoId}/cancelar": {
            patch: {
                tags:    ["Turnos"],
                summary: "Paciente cancela un turno",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["motivo"],
                                properties: { motivo: { type: "string", example: "No puedo asistir" } },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Turno cancelado" } },
            },
        },
        "/paciente/{id}/turnos/{turnoId}/solicitar-cambio": {
            post: {
                tags:    ["Turnos"],
                summary: "Paciente solicita cambio de fecha",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nuevaFecha", "nuevaHora"],
                                properties: {
                                    nuevaFecha: { type: "string", example: "2026-05-21" },
                                    nuevaHora:  { type: "string", example: "10:00" },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: "Cambio solicitado" } },
            },
        },
        "/paciente/{id}/turnos/{turnoId}/confirmar-propuesta": {
            patch: {
                tags:    ["Turnos"],
                summary: "Paciente confirma propuesta de cambio del médico",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Propuesta confirmada" } },
            },
        },
        "/paciente/{id}/turnos/{turnoId}/rechazar-propuesta": {
            patch: {
                tags:    ["Turnos"],
                summary: "Paciente rechaza propuesta de cambio del médico",
                parameters: [
                    { name: "id",      in: "path", required: true, schema: { type: "integer" } },
                    { name: "turnoId", in: "path", required: true, schema: { type: "integer" } },
                ],
                responses: { 200: { description: "Propuesta rechazada" } },
            },
        },

        // ── Búsqueda ───────────────────────────────────────────────────────────
        "/turno/buscar": {
            get: {
                tags:    ["Búsqueda"],
                summary: "Buscar turnos disponibles",
                parameters: [
                    { name: "pacienteId",  in: "query", required: true,  schema: { type: "integer" }, description: "ID del paciente" },
                    { name: "medicoId",    in: "query", required: false, schema: { type: "integer" }, description: "Filtrar por médico" },
                    { name: "especialidad", in: "query", required: false, schema: { type: "string"  }, description: "Filtrar por especialidad" },
                    { name: "practica",    in: "query", required: false, schema: { type: "string"  }, description: "Filtrar por práctica" },
                    { name: "sede",        in: "query", required: false, schema: { type: "string"  }, description: "Filtrar por sede" },
                    { name: "fechaDesde",  in: "query", required: false, schema: { type: "string"  }, description: "Fecha de inicio (YYYY-MM-DD)" },
                    { name: "fechaHasta",  in: "query", required: false, schema: { type: "string"  }, description: "Fecha de fin (YYYY-MM-DD)" },
                    { name: "direccion",   in: "query", required: false, schema: { type: "string", enum: ["asc", "desc"], default: "asc" }, description: "Orden de los días en el resultado: asc (default) o desc" },
                ],
                responses: { 200: { description: "Turnos agrupados por día con cobertura calculada" } },
            },
        },

        // ── Notificaciones ─────────────────────────────────────────────────────
        "/notificaciones/{usuarioId}/sin-leer": {
            get: {
                tags:    ["Notificaciones"],
                summary: "Obtener notificaciones sin leer",
                parameters: [{ name: "usuarioId", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Notificaciones sin leer" } },
            },
        },
        "/notificaciones/{usuarioId}/leidas": {
            get: {
                tags:    ["Notificaciones"],
                summary: "Obtener notificaciones leídas",
                parameters: [{ name: "usuarioId", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Notificaciones leídas" } },
            },
        },
        "/notificaciones/{id}/leer": {
            patch: {
                tags:    ["Notificaciones"],
                summary: "Marcar notificación como leída",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { 200: { description: "Notificación marcada como leída" } },
            },
        },
    },
};
