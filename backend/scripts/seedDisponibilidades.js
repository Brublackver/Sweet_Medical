/*
    SEED — Plantel médico y agenda a 6+ meses.

        npm run seed:disponibilidades
        MESES=12 npm run seed:disponibilidades     (horizonte a medida)

    Para qué sirve: que la app SIEMPRE tenga turnos para mostrar. La búsqueda
    por defecto mira de hoy a +30 días; si la agenda quedó en el pasado, la
    pantalla aparece vacía y parece que el sistema está roto cuando en realidad
    solo falta cargar disponibilidad.

    AUTOSUFICIENTE — pensado para sobrevivir una migración de hosting. Corre
    igual contra la base actual (enriquece lo que ya existe) que contra una base
    VACÍA (crea sedes, obras sociales, médicos y servicios desde cero). Eso es lo
    que permite levantar el proyecto en un proveedor nuevo con un solo comando.

    IDEMPOTENTE — se puede correr las veces que haga falta:
      · los médicos se buscan por `usuario`, no se duplican;
      · las especialidades y prácticas se agregan solo si falta el código;
      · las sedes se asignan solo si no estaban;
      · las fechas que ya tienen agenda cargada se saltean.

    NO usa los servicios de aplicación a propósito: MedicoService.definirDisponibilidad
    dispara la evaluación de la fila de espera, y sembrar 6 meses de agenda
    generaría una avalancha de notificaciones. Acá se escribe por el repositorio,
    que es la capa correcta para una carga masiva de datos.
*/

import dotenv   from "dotenv";
import mongoose from "mongoose";

import MedicoModel               from "../models/MedicoModel.js";
import { MedicoRepository }      from "../repositories/MedicoRepository.js";
import { SedeRepository }        from "../repositories/SedeRepository.js";
import { ObraSocialRepository }  from "../repositories/ObraSocialRepository.js";
import { hashPassword }          from "../auth/password.js";
import { fechaHoyISO }           from "../domain/tiempo.js";

dotenv.config();

// Horizonte de agenda. El pedido es "6 meses por lo menos": se usan 7 para tener
// margen y que nadie se quede sin turnos por dejar pasar unas semanas.
const MESES = Number(process.env.MESES) || 7;

// Día de la semana, en la convención de getUTCDay(): 0 = domingo … 6 = sábado.
const LUN = 1, MAR = 2, MIE = 3, JUE = 4, VIE = 5, SAB = 6;

/*
    El plantel vive en código para que el seed sea reproducible. Los médicos se
    identifican por `usuario`: si ya existe, se lo enriquece; si no, se lo crea.

    Cada uno tiene su propia agenda semanal — mañanas, tardes, algún sábado — así
    los resultados de búsqueda no salen todos iguales y se nota la diferencia
    entre filtrar por un médico u otro.
*/
const PLANTEL = [
    {
        usuario: "clopez", nombre: "Dr. Carlos López", matricula: "M10001",
        especialidades: [
            { codigo: "NEUR", nombre: "Neurología",     duracionTurnoEnMins: 40, costo: 6000 },
            { codigo: "CLIN", nombre: "Clínica Médica", duracionTurnoEnMins: 20, costo: 3000 },
            { codigo: "CARD", nombre: "Cardiología",    duracionTurnoEnMins: 30, costo: 5000 },
        ],
        practicas: [
            { codigo: "RX",  nombre: "Radiografía",           duracionTurnoEnMins: 10, costo: 1500 },
            { codigo: "EEG", nombre: "Electroencefalograma",  duracionTurnoEnMins: 45, costo: 3500 },
        ],
        sedes:  ["Medrano", "Campus"],
        agenda: [{ dias: [LUN, MIE, VIE], desde: "08:00", hasta: "13:00" }],
    },
    {
        usuario: "agomez", nombre: "Dra. Ana Gómez", matricula: "M10002",
        especialidades: [
            { codigo: "CARD", nombre: "Cardiología", duracionTurnoEnMins: 30, costo: 5000 },
            { codigo: "PEDI", nombre: "Pediatría",   duracionTurnoEnMins: 30, costo: 4000 },
        ],
        practicas: [
            { codigo: "ECG", nombre: "Electrocardiograma",   duracionTurnoEnMins: 15, costo: 2000 },
            { codigo: "ERM", nombre: "Resonancia Magnética", duracionTurnoEnMins: 60, costo: 8000 },
            { codigo: "EEG", nombre: "Electroencefalograma", duracionTurnoEnMins: 45, costo: 3500 },
        ],
        sedes: ["Medrano", "Campus"],
        agenda: [
            { dias: [MAR, JUE], desde: "14:00", hasta: "19:00" },
            { dias: [SAB],      desde: "09:00", hasta: "13:00" },
        ],
    },
    {
        usuario: "Dr.Bruno", nombre: "Carlos Raul Bruno", matricula: "M10003",
        especialidades: [
            { codigo: "TRAU", nombre: "Traumatología", duracionTurnoEnMins: 60, costo: 3500 },
        ],
        practicas: [
            { codigo: "ECO", nombre: "Ecografía",     duracionTurnoEnMins: 30, costo: 4000 },
            { codigo: "RX",  nombre: "Radiografía",   duracionTurnoEnMins: 10, costo: 1500 },
        ],
        sedes:  ["Medrano"],
        agenda: [{ dias: [LUN, MAR, MIE, JUE, VIE], desde: "10:00", hasta: "14:00" }],
    },
    {
        usuario: "jlennon", nombre: "Dr. John Lennon", matricula: "M10004",
        especialidades: [
            { codigo: "DERM", nombre: "Dermatología",  duracionTurnoEnMins: 20, costo: 4500 },
            { codigo: "OFTA", nombre: "Oftalmología",  duracionTurnoEnMins: 25, costo: 4800 },
        ],
        practicas: [
            { codigo: "LAB",  nombre: "Análisis de sangre", duracionTurnoEnMins: 15, costo: 1200 },
            { codigo: "ESPI", nombre: "Espirometría",       duracionTurnoEnMins: 30, costo: 2800 },
        ],
        sedes: ["Campus"],
        agenda: [
            { dias: [MAR, MIE, JUE], desde: "09:00", hasta: "12:00" },
            { dias: [MAR, MIE, JUE], desde: "16:00", hasta: "19:00" },
        ],
    },
    {
        usuario: "demo.medico", nombre: "Dr Demo", matricula: "M10005",
        especialidades: [
            { codigo: "GINE", nombre: "Ginecología",   duracionTurnoEnMins: 30, costo: 5200 },
            { codigo: "CLIN", nombre: "Clínica Médica", duracionTurnoEnMins: 20, costo: 3000 },
        ],
        practicas: [
            { codigo: "PAP", nombre: "Papanicolau",  duracionTurnoEnMins: 20, costo: 2200 },
            { codigo: "ECO", nombre: "Ecografía",    duracionTurnoEnMins: 30, costo: 4000 },
        ],
        sedes:  ["Medrano", "Campus"],
        agenda: [{ dias: [LUN, MAR, MIE, JUE, VIE], desde: "08:00", hasta: "11:00" }],
    },
];

// --- Fechas -----------------------------------------------------------------

// Todas las fechas del horizonte que caen en alguno de los días pedidos.
// Se itera en UTC (sufijo Z + setUTCDate) para que el listado no se corra un día
// según la zona horaria del proceso — mismo criterio que BusquedaService.
const fechasDeAgenda = (dias, desdeISO, meses) => {
    const cursor = new Date(`${desdeISO}T00:00:00Z`);
    const fin    = new Date(`${desdeISO}T00:00:00Z`);
    fin.setUTCMonth(fin.getUTCMonth() + meses);

    const fechas = [];
    while (cursor <= fin) {
        if (dias.includes(cursor.getUTCDay()))
            fechas.push(cursor.toISOString().split("T")[0]);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return fechas;
};

// --- Siembra por médico ------------------------------------------------------

// Busca al médico por usuario. Si no existe, lo crea con contraseña = usuario
// (misma convención que setDefaultPasswords.js).
const obtenerOCrearMedico = (medicoRepository, ficha) =>
    MedicoModel.findOne({ usuario: ficha.usuario }).lean()
        .then((doc) => {
            if (doc) return medicoRepository.obtenerPorId(doc.medicoId).then((m) => ({ medico: m, creado: false }));
            return hashPassword(ficha.usuario)
                .then((password) => medicoRepository.crear({
                    usuario:   ficha.usuario,
                    password,
                    matricula: ficha.matricula,
                    nombre:    ficha.nombre,
                }))
                .then((medico) => ({ medico, creado: true }));
        });

// Agrega servicios y sedes que falten. Los métodos del dominio ya devuelven
// null/false cuando el elemento existe, así que la idempotencia sale gratis.
const completarServicios = (medico, ficha, sedes) => {
    const resumen = { especialidades: 0, practicas: 0, sedes: 0 };

    for (const esp of ficha.especialidades)
        if (medico.agregarEspecialidad(esp)) resumen.especialidades++;

    for (const prac of ficha.practicas)
        if (medico.agregarPractica(prac)) resumen.practicas++;

    for (const nombreSede of ficha.sedes) {
        const sede = sedes.find((s) => s.nombre === nombreSede);
        if (sede && medico.agregarSede(sede)) resumen.sedes++;
    }

    return resumen;
};

// Carga la agenda saltando las fechas que ya tienen disponibilidad, para no
// reprocesar meses enteros en cada corrida.
const completarAgenda = (medico, ficha, desdeISO) => {
    const yaCargadas = new Set(medico.disponibilidades.map((d) => d.fecha));
    let agregadas = 0;

    for (const bloque of ficha.agenda) {
        for (const fecha of fechasDeAgenda(bloque.dias, desdeISO, MESES)) {
            // Un bloque nuevo en una fecha que ya tenía agenda se fusionaría con
            // lo existente; se saltea para que re-correr el seed no toque nada.
            if (yaCargadas.has(fecha)) continue;
            medico.definirDisponibilidad({
                fecha, horaDesde: bloque.desde, horaHasta: bloque.hasta,
            });
            agregadas++;
        }
    }
    return agregadas;
};

const sembrarMedico = (medicoRepository, sedes, ficha, desdeISO) =>
    obtenerOCrearMedico(medicoRepository, ficha)
        .then(({ medico, creado }) => {
            const servicios = completarServicios(medico, ficha, sedes);
            const agenda    = completarAgenda(medico, ficha, desdeISO);

            return medicoRepository.actualizar(medico).then((guardado) => {
                const etiqueta = creado ? "creado" : "actualizado";
                console.log(
                    `  • ${ficha.nombre} (${etiqueta}) — ` +
                    `+${servicios.especialidades} esp, +${servicios.practicas} práct, ` +
                    `+${servicios.sedes} sedes, +${agenda} días de agenda ` +
                    `→ ${guardado.disponibilidades.length} en total`
                );
                return agenda;
            });
        });

// --- Main --------------------------------------------------------------------

const main = () => {
    if (!process.env.MONGODB_URI) {
        console.error("Falta MONGODB_URI en el .env");
        process.exit(1);
    }

    const medicoRepository     = new MedicoRepository();
    const sedeRepository       = new SedeRepository();
    const obraSocialRepository = new ObraSocialRepository();

    const desdeISO = fechaHoyISO();

    return mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log(`Conectado. Sembrando agenda desde ${desdeISO} por ${MESES} meses…\n`);
            // Catálogos primero: en una base vacía los médicos necesitan sedes
            // que existan, y el registro de pacientes necesita obras sociales.
            return sedeRepository.inicializar().then(() => obraSocialRepository.inicializar());
        })
        .then(() => sedeRepository.obtenerTodos())
        .then((sedes) =>
            // Secuencial a propósito: el contador de ids de médico es compartido
            // y en paralelo habría carrera al crear varios de una.
            PLANTEL.reduce(
                (cadena, ficha) => cadena.then((total) =>
                    sembrarMedico(medicoRepository, sedes, ficha, desdeISO)
                        .then((agregadas) => total + agregadas)
                ),
                Promise.resolve(0)
            )
        )
        .then((total) => {
            console.log(`\nListo. ${total} días de agenda nuevos sobre ${PLANTEL.length} médicos.`);
            if (total === 0) console.log("(La agenda ya estaba cargada: el seed es idempotente.)");
            return mongoose.disconnect();
        })
        .then(() => process.exit(0));
};

main().catch((err) => {
    console.error("Error en el seed:", err.message);
    process.exit(1);
});
