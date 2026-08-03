/*
    SERVICE — Cuentas de prueba (invitados)

    Permite que cualquiera pruebe la app sin registrarse: crea un paciente
    temporal, le asigna una obra social y un plan del catálogo, y devuelve la
    cuenta lista para usar. Vence sola a las pocas horas.

    Vive en su propio service y no dentro de PacienteService porque su
    responsabilidad no es la del paciente real: acá lo que se modela es el CICLO
    DE VIDA de una cuenta descartable — se crea sin datos, vence, y se barre con
    todo lo que dejó atrás. Mezclarlo con el alta normal ensucia las dos cosas.

    LIMPIEZA — no se usa un índice TTL de MongoDB. El TTL borraría el paciente
    pero dejaría sus turnos y sus avisos huérfanos: los turnos seguirían ocupando
    slots de la agenda para siempre. Acá el barrido borra la cuenta Y su rastro.

    El barrido se dispara al crear una cuenta nueva (self-healing, sin cron ni
    infra extra). Si nadie entra a probar, no hay nada que limpiar y no importa
    que queden vencidas dando vueltas.
*/

import { hashPassword } from "../auth/password.js";
import { randomUUID }   from "crypto";

// Cuánto vive una cuenta de prueba. "Un rato": suficiente para recorrer la app
// entera sin apuro, poco para que no se acumulen.
const MINUTOS_POR_DEFECTO = 120;

export class PacienteDemoService {
    constructor({ pacienteRepository, turnoRepository, avisoDisponibilidadRepository, obraSocialService, minutosDeVida } = {}) {
        this.pacienteRepository            = pacienteRepository;
        this.turnoRepository               = turnoRepository;
        this.avisoDisponibilidadRepository = avisoDisponibilidadRepository;
        this.obraSocialService             = obraSocialService;
        this.minutosDeVida = minutosDeVida || Number(process.env.DEMO_TTL_MINUTOS) || MINUTOS_POR_DEFECTO;
    }

    // Crea la cuenta temporal ya utilizable. Antes barre las vencidas, así el
    // mantenimiento ocurre solo, sin tarea programada.
    crear() {
        return this.limpiarExpirados()
            .then(() => Promise.all([
                this.pacienteRepository.siguienteNumeroDemo(),
                this._elegirCobertura(),
            ]))
            .then(([numero, cobertura]) => {
                const expiraEn = new Date(Date.now() + this.minutosDeVida * 60000);

                // La contraseña es aleatoria y no se le muestra a nadie: el invitado
                // entra con el token que devuelve el endpoint, nunca por el login.
                return hashPassword(randomUUID()).then((password) => this.pacienteRepository.crear({
                    usuario:    `invitado_${numero}`,
                    password,
                    // Rango sintético reservado para invitados: no colisiona con
                    // DNIs reales y deja claro de un vistazo que la cuenta es de prueba.
                    dni:        String(99000000 + numero),
                    nombre:     `Invitado #${numero}`,
                    obraSocial: cobertura.obraSocial,
                    plan:       cobertura.plan,
                    esDemo:     true,
                    expiraEn,
                }));
            });
    }

    // Borra las cuentas vencidas junto con sus turnos y sus avisos.
    // Devuelve cuántas barrió.
    limpiarExpirados(ahora = new Date()) {
        return this.pacienteRepository.obtenerDemosExpirados(ahora)
            .then((expirados) =>
                // Secuencial: son pocos y así un fallo no deja a medias el resto.
                expirados.reduce(
                    (cadena, paciente) => cadena.then(() =>
                        this._borrarRastro(paciente.pacienteId)
                            .then(() => this.pacienteRepository.eliminar(paciente.pacienteId))
                    ),
                    Promise.resolve()
                ).then(() => expirados.length)
            )
            // El barrido es mantenimiento: si falla, no puede impedir que alguien
            // entre a probar la app.
            .catch(() => 0);
    }

    _borrarRastro(pacienteId) {
        const borrarTurnos = this.turnoRepository
            ? this.turnoRepository.eliminarPorPaciente(pacienteId)
            : Promise.resolve();
        const borrarAvisos = this.avisoDisponibilidadRepository
            ? this.avisoDisponibilidadRepository.eliminarPorPaciente(pacienteId)
            : Promise.resolve();
        return Promise.all([borrarTurnos, borrarAvisos]);
    }

    /*
        Elige obra social y plan del catálogo real.

        Se prefiere un plan de cobertura PARCIAL (ni 0% ni 100%) a propósito: es
        el caso que mejor muestra el sistema, porque en los resultados de búsqueda
        se ve el descuento aplicado y el monto a abonar. Con 0% o 100% la pantalla
        se ve igual de bien pero no se entiende qué hace la cobertura.
    */
    _elegirCobertura() {
        if (!this.obraSocialService) return Promise.resolve({ obraSocial: null, plan: null });

        return this.obraSocialService.obtenerTodas()
            .then((obrasSociales) => {
                const conPlanes = obrasSociales.filter((os) => (os.planes || []).length > 0);
                if (conPlanes.length === 0) return { obraSocial: null, plan: null };

                const elegida = conPlanes[Math.floor(Math.random() * conPlanes.length)];
                const parciales = elegida.planes.filter(
                    (p) => p.coberturaGeneral > 0 && p.coberturaGeneral < 100
                );
                const candidatos = parciales.length > 0 ? parciales : elegida.planes;
                const plan = candidatos[Math.floor(Math.random() * candidatos.length)];

                return {
                    obraSocial: elegida.nombre,
                    plan: { nombre: plan.nombre, coberturaGeneral: plan.coberturaGeneral },
                };
            })
            // Sin catálogo disponible el invitado igual entra, solo que sin cobertura.
            .catch(() => ({ obraSocial: null, plan: null }));
    }
}
