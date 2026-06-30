import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const adminAuth  = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const medAuth    = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'MEDICO', id })}` });

const MEDICO_BASE = {
  usuario:   'drtest',
  password:  '1234',
  nombre:    'Dr. García',
  matricula: 'M12345',
};

const crearMedico = () =>
  request(app).post('/medico').set(adminAuth()).send(MEDICO_BASE)
    .then((r) => r.body.data);

// ---------------------------------------------------------------------------
// GET /medico
// ---------------------------------------------------------------------------
describe('GET /medico', () => {
  it('devuelve lista vacía cuando no hay médicos', async () => {
    const res = await request(app).get('/medico').set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('devuelve los médicos creados', async () => {
    await crearMedico();

    const res = await request(app).get('/medico').set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nombre).toBe('Dr. García');
  });

  it('requiere token de autenticación', async () => {
    const res = await request(app).get('/medico');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /medico
// ---------------------------------------------------------------------------
describe('POST /medico', () => {
  it('admin puede crear un médico', async () => {
    const res = await request(app)
      .post('/medico')
      .set(adminAuth())
      .send(MEDICO_BASE);

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Dr. García');
    expect(res.body.data.medico_id).toBeDefined();
    expect(res.body.data.matricula).toBe('M12345');
  });

  it('rechaza creación con datos incompletos', async () => {
    const res = await request(app)
      .post('/medico')
      .set(adminAuth())
      .send({ usuario: 'sinmatricula' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /medico/:id
// ---------------------------------------------------------------------------
describe('GET /medico/:id', () => {
  it('devuelve los datos de un médico existente', async () => {
    const medico = await crearMedico();

    const res = await request(app)
      .get(`/medico/${medico.medico_id}`)
      .set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body.data.medico_id).toBe(medico.medico_id);
    expect(res.body.data.nombre).toBe('Dr. García');
  });

  it('retorna 404 para un médico inexistente', async () => {
    const res = await request(app)
      .get('/medico/99999')
      .set(adminAuth());

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /medico/:id/disponibilidad
// — el controller devuelve `data = medico.disponibilidades[]` (no el medico)
// — la ruta no tiene requireOwnership: cualquier usuario autenticado puede definirla
// ---------------------------------------------------------------------------
describe('POST /medico/:id/disponibilidad', () => {
  it('define disponibilidad horaria y retorna el array de disponibilidades', async () => {
    const medico = await crearMedico();

    const res = await request(app)
      .post(`/medico/${medico.medico_id}/disponibilidad`)
      .set(medAuth(medico.medico_id))
      .send({ fecha: '2030-12-15', horaDesde: '09:00', horaHasta: '17:00' });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].fecha).toBe('2030-12-15');
  });

  it('rechaza disponibilidad con formato de fecha inválido', async () => {
    const medico = await crearMedico();

    const res = await request(app)
      .post(`/medico/${medico.medico_id}/disponibilidad`)
      .set(medAuth(medico.medico_id))
      .send({ fecha: '15-12-2030', horaDesde: '09:00', horaHasta: '17:00' });

    expect(res.status).toBe(400);
  });

  it('requiere autenticación', async () => {
    const medico = await crearMedico();

    const res = await request(app)
      .post(`/medico/${medico.medico_id}/disponibilidad`)
      .send({ fecha: '2030-12-15', horaDesde: '09:00', horaHasta: '17:00' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /medico/:id/especialidades
// — el controller devuelve `data = esp` (la especialidad creada, no el medico)
// ---------------------------------------------------------------------------
describe('POST /medico/:id/especialidades', () => {
  it('agrega una especialidad y retorna el objeto de especialidad', async () => {
    const medico = await crearMedico();

    const res = await request(app)
      .post(`/medico/${medico.medico_id}/especialidades`)
      .set(medAuth(medico.medico_id))
      .send({ codigo: 'CARD', nombre: 'Cardiología', duracionTurnoEnMins: 30, costo: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.data.codigo).toBe('CARD');
    expect(res.body.data.nombre).toBe('Cardiología');
  });

  it('rechaza especialidad duplicada', async () => {
    const medico = await crearMedico();
    await request(app)
      .post(`/medico/${medico.medico_id}/especialidades`)
      .set(medAuth(medico.medico_id))
      .send({ codigo: 'CARD', nombre: 'Cardiología', duracionTurnoEnMins: 30, costo: 5000 });

    const res = await request(app)
      .post(`/medico/${medico.medico_id}/especialidades`)
      .set(medAuth(medico.medico_id))
      .send({ codigo: 'CARD', nombre: 'Cardiología', duracionTurnoEnMins: 30, costo: 5000 });

    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// DELETE /medico/:id
// ---------------------------------------------------------------------------
describe('DELETE /medico/:id', () => {
  it('admin puede eliminar un médico', async () => {
    const medico = await crearMedico();

    const res = await request(app)
      .delete(`/medico/${medico.medico_id}`)
      .set(adminAuth());

    expect(res.status).toBe(204);
  });
});
