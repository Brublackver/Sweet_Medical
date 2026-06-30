export class ObraSocialController {
    constructor({ obraSocialService } = {}) {
        this.obraSocialService = obraSocialService;
    }

    // GET /obra-social — catálogo completo de obras sociales con sus planes.
    obtenerTodas = (req, res, next) =>
        this.obraSocialService.obtenerTodas()
            .then((obrasSociales) => res.status(200).json({ status: "success", data: obrasSociales }))
            .catch(next);
}
