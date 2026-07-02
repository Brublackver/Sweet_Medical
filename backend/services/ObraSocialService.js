/*
    SERVICE — Catálogo de Obras Sociales

    Las obras sociales son un catálogo del sistema (datos maestros). El paciente
    elige una y un plan; no las inventa. Por ahora el catálogo es solo lectura.
*/
export class ObraSocialService {
    constructor({ obraSocialRepository } = {}) {
        this.obraSocialRepository = obraSocialRepository;
    }

    obtenerTodas() {
        return this.obraSocialRepository.obtenerTodos();
    }
}
