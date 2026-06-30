import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function iniciarDB() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

export async function detenerDB() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function limpiarColecciones() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((col) => col.deleteMany({})));
}
