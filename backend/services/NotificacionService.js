import { NotFoundError, BadRequestError } from "../errors/AppError.js";

export class NotificacionService {
    constructor({ notificacionRepository } = {}) {
        this.notificacionRepository = notificacionRepository;
    }

    crear(usuarioId, tipo, mensaje) {
        return this.notificacionRepository.crear(usuarioId, tipo, mensaje);
    }

    // leida = true → solo leídas | leida = false → solo sin leer | undefined → todas
    obtenerPorMedico(medicoId, leida) {
        return this.notificacionRepository.obtenerPorUsuario(medicoId, leida);
    }

    marcarLeida(medicoId, notificacionId) {
        return this.notificacionRepository.obtenerPorId(notificacionId)
            .then((notificacion) => {
                if (!notificacion)
                    return Promise.reject(new NotFoundError("Notificación no encontrada"));
                if (notificacion.usuarioId !== medicoId)
                    return Promise.reject(new BadRequestError("La notificación no pertenece al médico"));
                notificacion.marcarLeida();
                return this.notificacionRepository.actualizar(notificacion);
            });
    }
}
