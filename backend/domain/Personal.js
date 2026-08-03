/*
    DOMAIN — Personal no médico

    Estructura DELIBERADAMENTE separada de Medico y Paciente. No comparte
    colección, ni contador de ids, ni credenciales: este personal no se loguea
    al sistema, no tiene agenda y no reserva turnos. Meterlo dentro de Medico
    "porque también es gente que trabaja acá" sería mezclar dos conceptos que
    no comparten NI UNA regla de negocio.

    El tipo se modela como una constante extensible, no como subclases: agregar
    "Seguridad" o "Mantenimiento" mañana es una línea acá y nada más. Si algún
    tipo llegara a tener reglas propias, ahí sí conviene especializar — hoy no
    las tiene, y jerarquizar sin necesidad es complejidad regalada.
*/

export const TIPOS_PERSONAL = Object.freeze({
    ADMINISTRACION: "ADMINISTRACION",
    LIMPIEZA:       "LIMPIEZA",
});

// Etiquetas legibles para la interfaz. Se mantienen junto a los tipos para que
// agregar uno nuevo sea un solo cambio y no dos archivos desincronizados.
export const ETIQUETAS_TIPO_PERSONAL = Object.freeze({
    [TIPOS_PERSONAL.ADMINISTRACION]: "Administración",
    [TIPOS_PERSONAL.LIMPIEZA]:       "Limpieza",
});

export class Personal {
    constructor(id, { nombre, apellido, documento, telefono, email, tipo, sede, observaciones } = {}) {
        this.id            = id;
        this.nombre        = nombre;
        this.apellido      = apellido;
        this.documento     = documento;
        this.telefono      = telefono      ?? null;
        this.email         = email         ?? null;
        this.tipo          = tipo;
        this.sede          = sede          ?? null;
        this.observaciones = observaciones ?? null;
        this.activo        = true;
        this.fechaAlta     = new Date().toISOString().split("T")[0];
        this.fechaBaja     = null;
    }

    get nombreCompleto() {
        return `${this.apellido}, ${this.nombre}`;
    }

    // Actualiza solo los campos presentes. El documento es el identificador del
    // legajo: se puede corregir, pero el service valida que no pise a otro.
    actualizar(datos = {}) {
        const camposEditables = [
            "nombre", "apellido", "documento", "telefono", "email",
            "tipo", "sede", "observaciones",
        ];
        for (const campo of camposEditables) {
            if (datos[campo] !== undefined) {
                const valor = datos[campo];
                this[campo] = typeof valor === "string" ? valor.trim() : valor;
            }
        }
        return this;
    }

    // Baja lógica: se conserva el legajo (y su historia) pero deja de estar
    // operativo. Es lo que quiere el negocio el 99% de las veces; el borrado
    // físico existe aparte para casos de carga errónea.
    desactivar() {
        if (!this.activo) return false;
        this.activo    = false;
        this.fechaBaja = new Date().toISOString().split("T")[0];
        return true;
    }

    activar() {
        if (this.activo) return false;
        this.activo    = true;
        this.fechaBaja = null;
        return true;
    }

    toJSON() {
        return {
            personal_id:     this.id,
            nombre:          this.nombre,
            apellido:        this.apellido,
            nombre_completo: this.nombreCompleto,
            documento:       this.documento,
            telefono:        this.telefono      ?? null,
            email:           this.email         ?? null,
            tipo:            this.tipo,
            tipo_label:      ETIQUETAS_TIPO_PERSONAL[this.tipo] ?? this.tipo,
            sede:            this.sede          ?? null,
            observaciones:   this.observaciones ?? null,
            activo:          this.activo !== false,
            fechaAlta:       this.fechaAlta,
            fechaBaja:       this.fechaBaja ?? null,
        };
    }
}
