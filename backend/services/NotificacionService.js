import { NotFoundError, BadRequestError } from "../errors/AppError.js";

export class NotificacionService {
    constructor({ notificacionRepository } = {}) {
        this.notificacionRepository = notificacionRepository;
    }

    // Crea una notificación dirigida a un usuario concreto (médico o paciente).
    // turnoId es opcional: lo llevan las notificaciones accionables (cambios de fecha).
    crear(usuarioTipo, usuarioId, tipo, mensaje, turnoId = null) {
        return this.notificacionRepository.crear(usuarioTipo, usuarioId, tipo, mensaje, turnoId);
    }

    // leida = true → solo leídas | leida = false → solo sin leer | undefined → todas
    obtenerPara(usuarioTipo, usuarioId, leida) {
        return this.notificacionRepository.obtenerPorUsuario(usuarioTipo, usuarioId, leida);
    }

    // Marca como resuelta la notificación accionable PENDIENTE que un usuario
    // tiene para un turno y tipo dados (p.ej. la SOLICITUD de cambio que el
    // médico tenía sin leer). La acción la dispara el TurnoService al confirmar
    // o rechazar un cambio, de modo que la decisión queda guardada SIEMPRE,
    // sin importar si el usuario respondió desde la campana o desde la tarjeta.
    // Si no hay ninguna notificación pendiente que coincida, es un no-op.
    resolverPorTurno(usuarioTipo, usuarioId, turnoId, tipo, resultado) {
        return this.notificacionRepository.obtenerPorUsuario(usuarioTipo, usuarioId, false)
            .then((notificaciones) => {
                const pendientes = notificaciones.filter(
                    (n) => n.turnoId === turnoId && n.tipo === tipo
                );
                if (pendientes.length === 0) return null;
                // Si hubo varias rondas de cambio sobre el mismo turno, resolvemos la más reciente.
                const objetivo = pendientes.sort(
                    (a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)
                )[0];
                objetivo.marcarResuelta(resultado);
                return this.notificacionRepository.actualizar(objetivo);
            });
    }

    // Marca como leída validando que la notificación pertenezca al usuario
    // que la reclama (clave compuesta usuarioTipo + usuarioId).
    // Si se pasa `resultado` ("ACEPTADO" | "RECHAZADO"), además deja registrado
    // cómo se resolvió la notificación accionable.
    marcarLeida(usuarioTipo, usuarioId, notificacionId, resultado = null) {
        return this.notificacionRepository.obtenerPorId(notificacionId)
            .then((notificacion) => {
                if (!notificacion)
                    return Promise.reject(new NotFoundError("Notificación no encontrada"));
                if (notificacion.usuarioTipo !== usuarioTipo || notificacion.usuarioId !== usuarioId)
                    return Promise.reject(new BadRequestError("La notificación no pertenece al usuario"));
                if (resultado) notificacion.marcarResuelta(resultado);
                else           notificacion.marcarLeida();
                return this.notificacionRepository.actualizar(notificacion);
            });
    }
}
