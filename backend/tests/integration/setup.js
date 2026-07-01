import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export function iniciarDB() {
  return MongoMemoryServer.create()
    .then((server) => {
      mongoServer = server;
      return mongoose.connect(mongoServer.getUri());
    });
}

export function detenerDB() {
  return mongoose.disconnect()
    .then(() => mongoServer.stop());
}

export function limpiarColecciones() {
  const collections = mongoose.connection.collections;
  return Promise.all(Object.values(collections).map((col) => col.deleteMany({})));
}
