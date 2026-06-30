import { Medico }              from "../domain/Medico.js";
import { Especialidad }        from "../domain/Especialidad.js";
import { Practica }            from "../domain/Practica.js";
import { DisponibilidadHoraria } from "../domain/DisponibilidadHoraria.js";
import { Sede }                from "../domain/Sede.js";
import MedicoModel             from "../models/MedicoModel.js";
import ContadorModel           from "../models/ContadorModel.js";

export class MedicoRepository {

    _siguienteId() {
        return ContadorModel.findOneAndUpdate(
            { nombre: "medico" },
            { $inc: { valor: 1 } },
            { new: true, upsert: true }
        ).then((doc) => doc.valor);
    }

    obtenerTodos() {
        return MedicoModel.find().lean()
            .then((docs) => docs.map((d) => this._toMedico(d)));
    }

    obtenerPorId(id) {
        return MedicoModel.findOne({ medicoId: id }).lean()
            .then((doc) => doc ? this._toMedico(doc) : null);
    }

    // Trae la credencial (incluido el hash) para autenticar. No pasa por
    // _toMedico porque el dominio Medico no modela la contraseña.
    obtenerCredencialPorUsuario(usuario) {
        return MedicoModel.findOne({ usuario }).select("+password").lean()
            .then((doc) => doc
                ? { id: doc.medicoId, usuario: doc.usuario, password: doc.password }
                : null
            );
    }

    eliminar(id) {
        return MedicoModel.deleteOne({ medicoId: id });
    }

    // Actualiza solo el hash de la contraseña. El hash llega listo desde el service.
    actualizarPassword(id, hash) {
        return MedicoModel.findOneAndUpdate(
            { medicoId: id },
            { password: hash },
            { new: true }
        );
    }

    crear(datos) {
        return this._siguienteId()
            .then((medicoId) => new MedicoModel({
                medicoId,
                usuario:   datos.usuario,
                password:  datos.password, // ya viene hasheada desde el service
                matricula: datos.matricula,
                nombre:    datos.nombre,
            }).save())
            .then((doc) => this._toMedico(doc.toObject()));
    }

    // Subdocumentos con id numérico propio; sedes embebidas con su info completa.
    actualizar(medico) {
        const update = {
            especialidades: medico.especialidades.map((e) => ({
                especId:             e.id,
                codigo:              e.codigo,
                nombre:              e.nombre,
                duracionTurnoEnMins: e.duracionTurnoEnMins,
                costo:               e.costo,
            })),
            practicas: medico.practicas.map((p) => ({
                practicaId:          p.id,
                codigo:              p.codigo,
                nombre:              p.nombre,
                duracionTurnoEnMins: p.duracionTurnoEnMins,
                costo:               p.costo,
            })),
            disponibilidades: medico.disponibilidades.map((d) => ({
                disponibilidadId: d.id,
                fecha:            d.fecha,
                horaDesde:        d.horaDesde,
                horaHasta:        d.horaHasta,
            })),
            sedes: medico.sedes.map((s) => ({
                sedeId:    s.id,
                nombre:    s.nombre,
                direccion: s.direccion,
            })),
        };

        return MedicoModel.findOneAndUpdate({ medicoId: medico.id }, update, { new: true })
            .lean()
            .then((doc) => this._toMedico(doc));
    }

    _toMedico(doc) {
        const medico = new Medico(doc.medicoId, doc.usuario, doc.matricula, doc.nombre);

        medico.especialidades = (doc.especialidades || []).map((e) => {
            const esp = new Especialidad(e.codigo, e.nombre, e.duracionTurnoEnMins, e.costo);
            esp.id = e.especId;
            return esp;
        });

        medico.practicas = (doc.practicas || []).map((p) => {
            const prac = new Practica(p.codigo, p.nombre, p.duracionTurnoEnMins, p.costo);
            prac.id = p.practicaId;
            return prac;
        });

        medico.disponibilidades = (doc.disponibilidades || []).map((d) => {
            const disp = new DisponibilidadHoraria(d.fecha, d.horaDesde, d.horaHasta);
            disp.id = d.disponibilidadId;
            return disp;
        });

        medico.sedes = (doc.sedes || []).map((s) => new Sede(s.sedeId, s.nombre, s.direccion));

        return medico;
    }
}
