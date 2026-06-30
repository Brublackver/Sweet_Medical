import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const adminAuth = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const pacAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'PACIENTE', id })}` });
const medAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'MEDICO', id })}` });

// ── Helpers de siembra ───────────────────────────────────────────────────────

const crearMedico = () =>
  request(app)
    .post('/medico')
    .set(adminAuth())
    .send({ usuario: 'drtest', password: '1234', nombre: 'Dr. García', matricula: 'M12345' })
    .then((r) => r.body.data);

const agregarDisponibilidad = (medicoId) =>
  request(app)
    .post(`/medico/${medicoId}/disponibilidad`)
    .set(medAuth(medicoId))
    .send({ fecha: '2030-12-15', horaDesde: '09:00', horaHasta: '17:00' });

const registrarPaciente = () =>
  request(app)
    .post('/auth/registro')
    .send({
      usuario:    'juantest',
      password:   '1234',
      dni:        '12345678',
      nombre:     'Juan Test',
      obraSocial: 'OSDE',
      plan:       { nombre: '310', coberturaGeneral: 80 },
    })
    .then((r) => r.body.data.usuario);

// ── Test ─────────────────────────────────────────────────────────────────────

describe('POST /paciente/:id/turno — Reservar turno', () => {
  it('un paciente reserva un turno, recibe el objeto completo y el turno queda en su historial', async () => {
    // ── 1. Siembra: médico con disponibilidad y paciente ────────────────────
    const medico   = await crearMedico();
    await agregarDisponibilidad(medico.medico_id);
    const paciente = await registrarPaciente();

    const body = {
      medicoId: medico.medico_id,
      fecha:    '2030-12-15',
      hora:     '09:00',
      duracion: 30,
    };

    // ── 2. Reserva ──────────────────────────────────────────────────────────
    const resReserva = await request(app)
      .post(`/paciente/${paciente.paciente_id}/turno`)
      .set(pacAuth(paciente.paciente_id))
      .send(body);

    // Status y envelope
    expect(resReserva.status).toBe(201);
    expect(resReserva.body.status).toBe('success');

    // Datos del turno creado
    const turno = resReserva.body.data;
    expect(turno.turno_id ?? turno.turnoId ?? turno.id).toBeDefined();
    expect(turno.estado).toBe('reservado');
    expect(turno.fecha).toBe('2030-12-15');
    expect(turno.hora).toBe('09:00');
    expect(turno.duracion).toBe(30);

    // Snapshot del médico embebido en el turno
    expect(turno.snapshotMedico).toBeDefined();
    expect(turno.snapshotMedico.nombre).toBe('Dr. García');
    expect(turno.snapshotMedico.matricula).toBe('M12345');

    // Snapshot del paciente embebido en el turno
    expect(turno.snapshotPaciente).toBeDefined();
    expect(turno.snapshotPaciente.nombre).toBe('Juan Test');

    // ── 3. Persistencia: el turno aparece en el historial del paciente ──────
    const resHistorial = await request(app)
      .get(`/paciente/${paciente.paciente_id}/turnos`)
      .set(pacAuth(paciente.paciente_id));

    expect(resHistorial.status).toBe(200);
    expect(resHistorial.body.data).toHaveLength(1);
    expect(resHistorial.body.data[0].fecha).toBe('2030-12-15');
    expect(resHistorial.body.data[0].hora).toBe('09:00');
    expect(resHistorial.body.data[0].estado).toBe('reservado');
  });
});
