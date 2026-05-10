/*
    SERVICE — Capa de lógica de negocio para Notificaciones

    Gestiona el ciclo de vida de las notificaciones del sistema.
    Las notificaciones son generadas internamente por otros services
    (ej: TurnoService al proponer un cambio de fecha) y consumidas
    por los usuarios a través de los tres endpoints de este service.
*/

import { NotFoundError } from "../errors/AppError.js";

export class NotificacionService {
    constructor({ notificacionRepository } = {}) {
        this.notificacionRepository = notificacionRepository;
    }

    // Crea una nueva notificación para un usuario.
    // Llamado internamente por otros services cuando ocurre un evento relevante.
    crear(usuarioId, tipo, mensaje) {
        return this.notificacionRepository.crear(usuarioId, tipo, mensaje);
    }

    // Retorna todas las notificaciones pendientes de lectura del usuario.
    // Usadas para mostrar alertas o badges en la interfaz.
    obtenerSinLeer(usuarioId) {
        return this.notificacionRepository.obtenerSinLeerPorUsuario(usuarioId);
    }

    // Retorna el historial de notificaciones ya leídas del usuario.
    obtenerLeidas(usuarioId) {
        return this.notificacionRepository.obtenerLeidasPorUsuario(usuarioId);
    }

    // Marca una notificación como leída. Valida que exista antes de cambiar su estado.
    marcarLeida(notificacionId) {
        return this.notificacionRepository.obtenerPorId(notificacionId)
            .then((notificacion) => {
                if (!notificacion)
                    return Promise.reject(new NotFoundError("Notificación no encontrada"));
                notificacion.marcarLeida();
                return this.notificacionRepository.actualizar(notificacion);
            });
    }
}
