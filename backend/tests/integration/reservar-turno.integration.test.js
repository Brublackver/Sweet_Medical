import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

/*
  TEST DE INTEGRACIÓN — Capa de Controladores (1 endpoint).

  Endpoint bajo test: POST /paciente/:id/turno  (reservar un turno).

  Es un test de integración porque el request atraviesa TODO el stack real, sin
  mockear capas: ruta → middleware de auth → PacienteController → PacienteService
  → TurnoService → dominio (Turno) → TurnoRepository → MongoDB (en memoria).

  El alta de médico, su disponibilidad y el registro del paciente son PRECONDICIONES
  (siembra) para poder ejercer el endpoint; el foco de las aserciones es la reserva
  en sí y su persistencia real.

  Estilo: promesas encadenadas (.then), como todo el proyecto.
*/

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const adminAuth = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const medAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'MEDICO', id })}` });
const pacAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'PACIENTE', id })}` });

const FECHA = '2030-12-15';

// ── Siembra (precondiciones del endpoint) ────────────────────────────────────

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
    .send({ fecha: FECHA, horaDesde: '09:00', horaHasta: '17:00' });

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

describe('POST /paciente/:id/turno — Reservar turno (integración de controladores)', () => {
  it('reserva un turno: responde 201 con snapshots y queda persistido en el historial', () => {
    let medico;
    let paciente;

    // Siembra: médico con disponibilidad + paciente registrado.
    return crearMedico()
      .then((m) => {
        medico = m;
        return agregarDisponibilidad(medico.medico_id);
      })
      .then(() => registrarPaciente())
      .then((p) => {
        paciente = p;

        // ── Endpoint bajo test ─────────────────────────────────────────────── solicitamos turno
        return request(app)
          .post(`/paciente/${paciente.paciente_id}/turno`)
          .set(pacAuth(paciente.paciente_id))
          .send({ medicoId: medico.medico_id, fecha: FECHA, hora: '09:00', duracion: 30 });
      })
      .then((res) => {
        // Envelope y status del controller
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');

        // Datos del turno creado
        const turno = res.body.data;
        expect(turno.turno_id).toBeDefined();
        expect(turno.estado).toBe('reservado');
        expect(turno.fecha).toBe(FECHA);
        expect(turno.hora).toBe('09:00');
        expect(turno.duracion).toBe(30);

        // Snapshots del médico y del paciente embebidos en el turno
        expect(turno.snapshotMedico.nombre).toBe('Dr. García');
        expect(turno.snapshotMedico.matricula).toBe('M12345');
        expect(turno.snapshotPaciente.nombre).toBe('Juan Test');

        // ── Persistencia real: el turno aparece en el historial del paciente ─
        return request(app)
          .get(`/paciente/${paciente.paciente_id}/turnos`)
          .set(pacAuth(paciente.paciente_id));
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].fecha).toBe(FECHA);
        expect(res.body.data[0].hora).toBe('09:00');
        expect(res.body.data[0].estado).toBe('reservado');
      });
  });
});
