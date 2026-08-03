/*
    DOMAIN — Aviso de disponibilidad (fila de espera)

    Cuando un paciente busca turnos y no encuentra ninguno, puede pedir que el
    sistema le avise cuando aparezca uno que cumpla ESOS MISMOS filtros. El aviso
    guarda una foto de los filtros usados en la búsqueda; después, cada vez que
    se libera u ofrece disponibilidad, el sistema los vuelve a evaluar.

    El aviso NO reserva nada: solo genera una notificación. La reserva sigue
    siendo un acto explícito del paciente (primero que llega, primero que reserva).

    Ciclo de vida:
        ACTIVO     → esperando que aparezca un turno que coincida
        NOTIFICADO → ya se avisó al paciente (evita spam por cada cancelación)
        CANCELADO  → el paciente dio de baja el aviso

    La huella es la identidad del aviso: misma huella + mismo paciente = la misma
    suscripción. Es lo que impide duplicados idénticos.
*/

export const ESTADOS_AVISO = Object.freeze({
    ACTIVO:     "ACTIVO",
    NOTIFICADO: "NOTIFICADO",
    CANCELADO:  "CANCELADO",
});

// Campos de búsqueda que un aviso puede recordar. Son exactamente los filtros
// que ya acepta GET /turno/buscar, más la obra social del paciente.
export const CAMPOS_FILTRO = Object.freeze([
    "medicoId",
    "especialidad",
    "practica",
    "sede",
    "obraSocial",
    "fechaDesde",
    "fechaHasta",
]);

export class AvisoDisponibilidad {
    constructor(id, pacienteId, filtros = {}) {
        this.id            = id;
        this.pacienteId    = pacienteId;
        this.filtros       = AvisoDisponibilidad.normalizarFiltros(filtros);
        this.huella        = AvisoDisponibilidad.calcularHuella(this.filtros);
        this.estado        = ESTADOS_AVISO.ACTIVO;
        this.fechaCreacion = new Date().toISOString();
        this.fechaAviso    = null;
    }

    // Deja los filtros en una forma canónica: string vacío / undefined → null.
    // Así "sin filtro" es siempre el mismo valor y la huella no cambia por un ''.
    static normalizarFiltros(filtros = {}) {
        const limpio = (valor) => {
            if (valor === undefined || valor === null || valor === "") return null;
            return typeof valor === "string" ? valor.trim() : valor;
        };
        return {
            medicoId:     filtros.medicoId != null && filtros.medicoId !== "" ? Number(filtros.medicoId) : null,
            especialidad: limpio(filtros.especialidad),
            practica:     limpio(filtros.practica),
            sede:         limpio(filtros.sede),
            obraSocial:   limpio(filtros.obraSocial),
            fechaDesde:   limpio(filtros.fechaDesde),
            fechaHasta:   limpio(filtros.fechaHasta),
        };
    }

    // Firma estable de los filtros. Case-insensitive porque "Cardiología" y
    // "cardiología" son la misma búsqueda para el usuario.
    static calcularHuella(filtros = {}) {
        const normalizados = AvisoDisponibilidad.normalizarFiltros(filtros);
        return CAMPOS_FILTRO
            .map((campo) => {
                const valor = normalizados[campo];
                return valor === null ? "" : String(valor).toLowerCase();
            })
            .join("|");
    }

    // ¿La fecha en la que apareció disponibilidad cae dentro del rango pedido?
    // Las fechas son "YYYY-MM-DD", por lo que comparar strings alcanza.
    cubreFecha(fecha) {
        if (this.filtros.fechaDesde && fecha < this.filtros.fechaDesde) return false;
        if (this.filtros.fechaHasta && fecha > this.filtros.fechaHasta) return false;
        return true;
    }

    // ¿Este aviso puede llegar a dispararse por disponibilidad de este médico?
    // Un aviso sin medicoId escucha a todos los médicos.
    aplicaAlMedico(medicoId) {
        return this.filtros.medicoId === null || this.filtros.medicoId === medicoId;
    }

    estaActivo() {
        return this.estado === ESTADOS_AVISO.ACTIVO;
    }

    // Se avisó al paciente: el aviso queda cumplido. No se vuelve a disparar
    // aunque haya más cancelaciones — si sigue sin conseguir turno, crea otro.
    marcarNotificado() {
        this.estado     = ESTADOS_AVISO.NOTIFICADO;
        this.fechaAviso = new Date().toISOString();
    }

    cancelar() {
        this.estado = ESTADOS_AVISO.CANCELADO;
    }

    // Texto legible de los filtros, para el mensaje de la notificación y para
    // que el paciente reconozca cuál de sus avisos es cuál.
    describir() {
        const partes = [];
        if (this.filtros.especialidad) partes.push(this.filtros.especialidad);
        if (this.filtros.practica)     partes.push(this.filtros.practica);
        if (this.filtros.sede)         partes.push(`sede ${this.filtros.sede}`);
        if (this.filtros.medicoId)     partes.push(`médico #${this.filtros.medicoId}`);
        if (this.filtros.obraSocial)   partes.push(this.filtros.obraSocial);
        if (partes.length === 0)       partes.push("cualquier turno");
        return partes.join(" · ");
    }

    toJSON() {
        return {
            aviso_id:      this.id,
            paciente_id:   this.pacienteId,
            filtros: {
                medicoId:     this.filtros.medicoId     ?? null,
                especialidad: this.filtros.especialidad ?? null,
                practica:     this.filtros.practica     ?? null,
                sede:         this.filtros.sede         ?? null,
                obraSocial:   this.filtros.obraSocial   ?? null,
                fechaDesde:   this.filtros.fechaDesde   ?? null,
                fechaHasta:   this.filtros.fechaHasta   ?? null,
            },
            descripcion:   this.describir(),
            estado:        this.estado,
            fechaCreacion: this.fechaCreacion,
            fechaAviso:    this.fechaAviso ?? null,
        };
    }
}
