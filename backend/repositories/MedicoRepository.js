/*
    REPOSITORY — Acceso a datos para Médicos (MongoDB)

    Medico es un agregado con subdocumentos embebidos (especialidades, practicas,
    disponibilidades) y sedes referenciadas por ObjectId.

    _toMedico: convierte un documento MongoDB en una instancia del dominio Medico,
    mapeando _id → id en el agregado y en cada subdocumento.

    actualizar: persiste el estado completo del dominio en MongoDB. Para subdocumentos
    nuevos (sin ObjectId válido), Mongoose asigna un _id automáticamente.
*/

import mongoose                from "mongoose";
import { Medico }              from "../domain/Medico.js";
import { Especialidad }        from "../domain/Especialidad.js";
import { Practica }            from "../domain/Practica.js";
import { DisponibilidadHoraria } from "../domain/DisponibilidadHoraria.js";
import MedicoModel             from "../models/MedicoModel.js";

export class MedicoRepository {

    obtenerTodos() {
        return MedicoModel.find().populate("sedes").lean()
            .then((docs) => docs.map((d) => this._toMedico(d)));
    }

    obtenerPorId(id) {
        return MedicoModel.findById(id).populate("sedes").lean()
            .then((doc) => doc ? this._toMedico(doc) : null);
    }

    crear(datos) {
        return new MedicoModel({
            usuario:   datos.usuario,
            matricula: datos.matricula,
            nombre:    datos.nombre,
        }).save()
            .then((doc) => this._toMedico(doc.toObject()));
    }

    // Persiste el estado completo del dominio Medico en MongoDB.
    // Subdocumentos con id válido preservan su _id; los nuevos reciben uno de Mongoose.
    actualizar(medico) {
        const mapSubdoc = (item, campos) => {
            const doc = { ...campos };
            if (mongoose.isValidObjectId(item.id)) doc._id = item.id;
            return doc;
        };

        const update = {
            especialidades: medico.especialidades.map((e) => mapSubdoc(e, {
                codigo:              e.codigo,
                nombre:              e.nombre,
                duracionTurnoEnMins: e.duracionTurnoEnMins,
                costo:               e.costo,
            })),
            practicas: medico.practicas.map((p) => mapSubdoc(p, {
                codigo:              p.codigo,
                nombre:              p.nombre,
                duracionTurnoEnMins: p.duracionTurnoEnMins,
                costo:               p.costo,
            })),
            disponibilidades: medico.disponibilidades.map((d) => mapSubdoc(d, {
                fecha:     d.fecha,
                horaDesde: d.horaDesde,
                horaHasta: d.horaHasta,
            })),
            sedes: medico.sedes.map((s) => s.id),
        };

        return MedicoModel.findByIdAndUpdate(medico.id, update, { new: true })
            .populate("sedes").lean()
            .then((doc) => this._toMedico(doc));
    }

    // Convierte documento MongoDB → instancia de dominio Medico con todos sus subdocumentos.
    _toMedico(doc) {
        const medico = new Medico(doc._id.toString(), doc.usuario, doc.matricula, doc.nombre);

        medico.especialidades = (doc.especialidades || []).map((e) => {
            const esp = new Especialidad(e.codigo, e.nombre, e.duracionTurnoEnMins, e.costo);
            esp.id = e._id.toString();
            return esp;
        });

        medico.practicas = (doc.practicas || []).map((p) => {
            const prac = new Practica(p.codigo, p.nombre, p.duracionTurnoEnMins, p.costo);
            prac.id = p._id.toString();
            return prac;
        });

        medico.disponibilidades = (doc.disponibilidades || []).map((d) => {
            const disp = new DisponibilidadHoraria(d.fecha, d.horaDesde, d.horaHasta);
            disp.id = d._id.toString();
            return disp;
        });

        medico.sedes = (doc.sedes || []).map((s) => ({
            id:       s._id.toString(),
            nombre:   s.nombre,
            direccion: s.direccion,
        }));

        return medico;
    }
}
