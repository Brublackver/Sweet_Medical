import app               from "./app.js";
import { conectarDB }    from "./db/connection.js";
import { SedeRepository } from "./repositories/SedeRepository.js";
import { ObraSocialRepository } from "./repositories/ObraSocialRepository.js";

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

const sedeRepository       = new SedeRepository();
const obraSocialRepository = new ObraSocialRepository();

// Conecta a MongoDB, siembra los catálogos iniciales y levanta el servidor.
conectarDB()
    .then(() => sedeRepository.inicializar())
    .then(() => obraSocialRepository.inicializar())
    .then(() => {
        app.listen(port, host, () => {
            console.log(`🚀 Servidor corriendo en http://${host}:${port}`);
        });
    });
