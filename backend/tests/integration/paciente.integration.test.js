import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const adminAuth  = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const pacAuth    = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'PACIENTE', id })}` });

const PACIENTE_BASE = {
  usuario:    'juantest',
  password:   '1234',
  dni:        '12345678',
  nombre:     'Juan Test',
  obraSocial: 'OSDE',
  plan:       { nombre: '310', coberturaGeneral: 80 },
};

const registrar = () =>
  request(app).post('/auth/registro').send(PACIENTE_BASE)
    .then((r) => r.body.data.usuario);

// ---------------------------------------------------------------------------
// GET /paciente — listado (requiere auth)
// ---------------------------------------------------------------------------
describe('GET /paciente', () => {
  it('admin obtiene la lista de pacientes', async () => {
    const res = await request(app).get('/paciente').set(adminAuth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('requiere token de autenticación', async () => {
    const res = await request(app).get('/paciente');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /paciente — creación por admin
// ---------------------------------------------------------------------------
describe('POST /paciente', () => {
  it('admin puede crear un paciente', async () => {
    const res = await request(app)
      .post('/paciente')
      .set(adminAuth())
      .send(PACIENTE_BASE);

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Juan Test');
    expect(res.body.data.paciente_id).toBeDefined();
  });

  it('rechaza creación sin datos obligatorios', async () => {
    const res = await request(app)
      .post('/paciente')
      .set(adminAuth())
      .send({ usuario: 'incompleto' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /paciente/:id
// ---------------------------------------------------------------------------
describe('GET /paciente/:id', () => {
  it('paciente puede ver sus propios datos', async () => {
    const p = await registrar();
    const res = await request(app)
      .get(`/paciente/${p.paciente_id}`)
      .set(pacAuth(p.paciente_id));

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Juan Test');
    expect(res.body.data.paciente_id).toBe(p.paciente_id);
  });

  it('cualquier usuario autenticado puede ver datos de un paciente (GET sin requireOwnership)', async () => {
    const p = await registrar();
    // La ruta GET /paciente/:id no tiene requireOwnership — solo exige estar autenticado
    const res = await request(app)
      .get(`/paciente/${p.paciente_id}`)
      .set(pacAuth(p.paciente_id + 99));

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Juan Test');
  });

  it('retorna 404 para un id inexistente', async () => {
    const res = await request(app)
      .get('/paciente/99999')
      .set(adminAuth());

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /paciente/:id/turnos
// ---------------------------------------------------------------------------
describe('GET /paciente/:id/turnos', () => {
  it('paciente obtiene su historial de turnos (vacío al inicio)', async () => {
    const p = await registrar();
    const res = await request(app)
      .get(`/paciente/${p.paciente_id}/turnos`)
      .set(pacAuth(p.paciente_id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// DELETE /paciente/:id
// ---------------------------------------------------------------------------
describe('DELETE /paciente/:id', () => {
  it('admin puede eliminar un paciente', async () => {
    const p = await registrar();
    const res = await request(app)
      .delete(`/paciente/${p.paciente_id}`)
      .set(adminAuth());

    expect(res.status).toBe(204);
  });
});
