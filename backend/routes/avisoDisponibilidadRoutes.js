/*
    Exporta las instancias de la fila de espera para inyección de dependencias.
    Las rutas HTTP viven en pacienteRoutes bajo /:id/avisos, igual que las
    notificaciones — el aviso es siempre de un paciente concreto.

    Este módulo depende SOLO de notificacionRoutes (una hoja del grafo de imports).
    BusquedaService se enchufa después, desde busquedaRoutes, con setBusquedaService:
    si lo pidiéramos por constructor tendríamos un ciclo, porque la búsqueda ya
    depende de médicos, turnos y pacientes.
*/

import { AvisoDisponibilidadController } from "../controllers/AvisoDisponibilidadController.js";
import { AvisoDisponibilidadService }    from "../services/AvisoDisponibilidadService.js";
import { AvisoDisponibilidadRepository } from "../repositories/AvisoDisponibilidadRepository.js";
import { notificacionService }           from "./notificacionRoutes.js";

export const avisoDisponibilidadRepository = new AvisoDisponibilidadRepository();
export const avisoDisponibilidadService    = new AvisoDisponibilidadService({
    avisoDisponibilidadRepository,
    notificacionService,
});
export const avisoDisponibilidadController = new AvisoDisponibilidadController({ avisoDisponibilidadService });
