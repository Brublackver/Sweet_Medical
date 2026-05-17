/*
    DB — Conexión a MongoDB con Mongoose

    Se conecta usando MONGODB_URI del .env.
    Si la conexión falla, el proceso termina — no tiene sentido levantar
    el servidor si no hay persistencia disponible.
*/

import mongoose from "mongoose";

export const conectarDB = () =>
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("MongoDB conectado:", process.env.MONGODB_URI))
        .catch((err) => {
            console.error("Error al conectar con MongoDB:", err.message);
            process.exit(1);
        });
