import AvisoDisponibilidadModel from "../models/AvisoDisponibilidadModel.js";
import ContadorModel            from "../models/ContadorModel.js";
import { AvisoDisponibilidad, ESTADOS_AVISO } from "../domain/AvisoDisponibilidad.js";

/*
    REPOSITORY — Avisos de disponibilidad (fila de espera)

    Mismo patrón que el resto: id numérico propio vía ContadorModel, el documento
    de Mongoose carga la clase de dominio (loadClass) y por eso responde a los
    métodos de negocio (cubreFecha, marcarNotificado, ...).
*/
export class AvisoDisponibilidadRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "avisoDisponibilidad" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    crear(pacienteId, filtros) {
        const normalizados = AvisoDisponibilidad.normalizarFiltros(filtros);
        return this._siguienteId()
            .then((avisoId) => new AvisoDisponibilidadModel({
                avisoId,
                pacienteId,
                filtros:       normalizados,
                huella:        AvisoDisponibilidad.calcularHuella(normalizados),
                estado:        ESTADOS_AVISO.ACTIVO,
                fechaCreacion: new Date().toISOString(),
            }).save());
    }

    obtenerPorId(id) {
        return AvisoDisponibilidadModel.findOne({ avisoId: id });
    }

    // Avisos de un paciente. estado = undefined → todos.
    obtenerPorPaciente(pacienteId, estado) {
        const filtro = { pacienteId };
        if (estado !== undefined) filtro.estado = estado;
        return AvisoDisponibilidadModel.find(filtro).sort({ avisoId: -1 });
    }

    // El aviso ACTIVO del paciente con esos mismos filtros, si ya existe.
    // Es la consulta que evita crear suscripciones idénticas duplicadas.
    buscarActivoPorHuella(pacienteId, huella) {
        return AvisoDisponibilidadModel.findOne({
            pacienteId, huella, estado: ESTADOS_AVISO.ACTIVO,
        });
    }

    // Todos los avisos pendientes de disparo. Es la cola que se recorre cuando
    // aparece disponibilidad nueva.
    obtenerActivos() {
        return AvisoDisponibilidadModel.find({ estado: ESTADOS_AVISO.ACTIVO });
    }

    // Borra los avisos de un paciente. Se usa al barrer cuentas demo vencidas:
    // un aviso de alguien que ya no existe nunca podría notificarse.
    eliminarPorPaciente(pacienteId) {
        return AvisoDisponibilidadModel.deleteMany({ pacienteId });
    }

    actualizar(aviso) {
        return AvisoDisponibilidadModel.findOneAndUpdate(
            { avisoId: aviso.id },
            { estado: aviso.estado, fechaAviso: aviso.fechaAviso ?? null },
            { new: true }
        );
    }
}
