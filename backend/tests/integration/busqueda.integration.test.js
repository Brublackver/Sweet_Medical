import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const adminAuth = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const medAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'MEDICO', id })}` });
const pacAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'PACIENTE', id })}` });

const PACIENTE_BASE = {
  usuario:    'pacbusqueda',
  password:   '1234',
  dni:        '87654321',
  nombre:     'Pac Búsqueda',
  obraSocial: 'OSDE',
  plan:       { nombre: '310', coberturaGeneral: 80 },
};

const MEDICO_BASE = {
  usuario:   'drbusqueda',
  password:  '1234',
  nombre:    'Dr. Búsqueda',
  matricula: 'M99999',
};

const registrarPaciente = () =>
  request(app).post('/auth/registro').send(PACIENTE_BASE)
    .then((r) => r.body.data.usuario);

const crearMedico = () =>
  request(app).post('/medico').set(adminAuth()).send(MEDICO_BASE)
    .then((r) => r.body.data);

// La búsqueda solo devuelve medicos con servicios (especialidades o prácticas).
const agregarEspecialidad = (medicoId) =>
  request(app)
    .post(`/medico/${medicoId}/especialidades`)
    .set(medAuth(medicoId))
    .send({ codigo: 'CARD', nombre: 'Cardiología', duracionTurnoEnMins: 30, costo: 5000 });

const definirDisponibilidad = (medicoId, fecha) =>
  request(app)
    .post(`/medico/${medicoId}/disponibilidad`)
    .set(medAuth(medicoId))
    .send({ fecha, horaDesde: '09:00', horaHasta: '17:00' });

// ---------------------------------------------------------------------------
// GET /turno/buscar
// ---------------------------------------------------------------------------
describe('GET /turno/buscar', () => {
  it('requiere el parámetro pacienteId', async () => {
    const res = await request(app)
      .get('/turno/buscar')
      .set(adminAuth());

    expect(res.status).toBe(400);
  });

  it('retorna array vacío cuando no hay médicos con disponibilidad', async () => {
    const p = await registrarPaciente();

    const res = await request(app)
      .get('/turno/buscar')
      .query({ pacienteId: p.paciente_id, fechaDesde: '2030-12-01', fechaHasta: '2030-12-07' })
      .set(pacAuth(p.paciente_id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const turnos = res.body.data.flatMap((d) => d.turnos);
    expect(turnos).toHaveLength(0);
  });

  it('retorna slots cuando hay médicos con especialidad y disponibilidad en el rango', async () => {
    const [p, m] = await Promise.all([registrarPaciente(), crearMedico()]);
    // El busquedaService filtra medicos sin servicios — hay que agregar al menos uno
    await agregarEspecialidad(m.medico_id);
    await definirDisponibilidad(m.medico_id, '2030-12-15');

    const res = await request(app)
      .get('/turno/buscar')
      .query({ pacienteId: p.paciente_id, fechaDesde: '2030-12-14', fechaHasta: '2030-12-16' })
      .set(pacAuth(p.paciente_id));

    expect(res.status).toBe(200);
    const turnos = res.body.data.flatMap((d) => d.turnos);
    expect(turnos.length).toBeGreaterThan(0);
  });

  it('requiere autenticación', async () => {
    const res = await request(app)
      .get('/turno/buscar')
      .query({ pacienteId: 1 });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /turno/buscar — filtros
// ---------------------------------------------------------------------------
describe('GET /turno/buscar — filtros', () => {
  it('filtra por especialidad y devuelve solo slots de esa especialidad', async () => {
    const [p, m] = await Promise.all([registrarPaciente(), crearMedico()]);
    await agregarEspecialidad(m.medico_id);
    await definirDisponibilidad(m.medico_id, '2030-12-15');

    const res = await request(app)
      .get('/turno/buscar')
      .query({
        pacienteId:   p.paciente_id,
        especialidad: 'Cardiología',
        fechaDesde:   '2030-12-14',
        fechaHasta:   '2030-12-16',
      })
      .set(pacAuth(p.paciente_id));

    expect(res.status).toBe(200);
    const turnos = res.body.data.flatMap((d) => d.turnos);
    expect(turnos.length).toBeGreaterThan(0);
    expect(turnos.every((t) => t.servicio.nombre === 'Cardiología')).toBe(true);
  });

  it('no devuelve turnos cuando la especialidad no coincide', async () => {
    const [p, m] = await Promise.all([registrarPaciente(), crearMedico()]);
    await agregarEspecialidad(m.medico_id);
    await definirDisponibilidad(m.medico_id, '2030-12-15');

    const res = await request(app)
      .get('/turno/buscar')
      .query({
        pacienteId:   p.paciente_id,
        especialidad: 'Dermatología',
        fechaDesde:   '2030-12-14',
        fechaHasta:   '2030-12-16',
      })
      .set(pacAuth(p.paciente_id));

    expect(res.status).toBe(200);
    const turnos = res.body.data.flatMap((d) => d.turnos);
    expect(turnos).toHaveLength(0);
  });
});
