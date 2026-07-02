/*
    MIGRACIÓN — Contraseñas por defecto para usuarios existentes.

    Los pacientes y médicos creados antes del login real no tienen contraseña.
    Este script les asigna una por defecto = su propio `usuario` (hasheada),
    para que puedan iniciar sesión. Corre una sola vez:

        node backend/scripts/setDefaultPasswords.js

    Es idempotente: solo toca los documentos que NO tienen contraseña.
*/

import dotenv from "dotenv";
import mongoose from "mongoose";
import PacienteModel from "../models/PacienteModel.js";
import MedicoModel   from "../models/MedicoModel.js";
import { hashPassword } from "../auth/password.js";

dotenv.config();

const migrar = async (Model, etiqueta) => {
    // password tiene select:false → hay que pedirlo explícito para ver si falta.
    const docs = await Model.find().select("+password");
    let actualizados = 0;

    for (const doc of docs) {
        if (!doc.password) {
            doc.password = await hashPassword(doc.usuario);
            await doc.save();
            actualizados++;
            console.log(`  • ${etiqueta} "${doc.usuario}" → contraseña = su usuario`);
        }
    }
    return actualizados;
};

(async () => {
    if (!process.env.MONGODB_URI) {
        console.error("Falta MONGODB_URI en el .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado. Asignando contraseñas por defecto…");

    const pacientes = await migrar(PacienteModel, "Paciente");
    const medicos   = await migrar(MedicoModel,   "Médico");

    console.log(`\nListo. Pacientes: ${pacientes} · Médicos: ${medicos} actualizados.`);
    console.log("La contraseña inicial de cada uno es su propio usuario.");

    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error("Error en la migración:", err.message);
    process.exit(1);
});
