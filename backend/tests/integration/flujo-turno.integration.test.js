import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

/*
  TEST DE INTEGRACIÓN ÚNICO — Flujo de negocio completo, extremo a extremo.

  Recorre el camino real de un turno a través de TODO el stack (rutas → controllers
  → services → domain → repositorios → MongoDB en memoria), sin mockear capas:

    1. Admin inicia sesión (auth real).
    2. Admin da de alta un médico.
    3. El médico agrega una especialidad y define su disponibilidad.
    4. Un paciente se registra y luego inicia sesión.
    5. El paciente busca turnos disponibles y encuentra el del médico.
    6. El paciente reserva el turno (con snapshots de médico y paciente).
    7. Se verifica que el turno quedó persistido tanto en el historial del
       paciente como en la agenda del médico.
    8. El paciente solicita un cambio de fecha → el turno queda pendiente.
    9. El médico confirma el cambio → el turno vuelve a "reservado" con la
       nueva hora, verificado desde la agenda del médico.

  Un solo test, pero que ejercita autenticación, autorización por rol, alta de
  entidades, búsqueda, reserva, y el flujo bidireccional de cambio de fecha.

  Estilo: encadenado con promesas (.then), como todo el resto del proyecto.
*/

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

// El médico no tiene flujo de login en este recorrido: se autentica con un token
// firmado directamente. Admin y paciente SÍ pasan por /auth/login para ejercitar
// la autenticación real.
const medAuth = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'MEDICO', id })}` });

const FECHA = '2030-12-15';

describe('Flujo completo de turno (integración end-to-end)', () => {
  it('registro → disponibilidad → búsqueda → reserva → cambio de fecha confirmado, persistido en todo el stack', () => {
    // Estado que se va acumulando entre pasos de la cadena.
    let adminAuth;
    let medicoId;
    let pacienteId;
    let pacAuth;
    let turnoId;

    // ── 1. Admin inicia sesión ───────────────────────────────────────────────
    return request(app)
      .post('/auth/login')
      .send({ rol: 'admin', usuario: 'admin', password: '123456' })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.tipo).toBe('ADMIN');
        adminAuth = { Authorization: `Bearer ${res.body.data.token}` };

        // ── 2. Admin da de alta un médico ────────────────────────────────────
        return request(app)
          .post('/medico')
          .set(adminAuth)
          .send({ usuario: 'drtest', password: '1234', nombre: 'Dr. García', matricula: 'M12345' });
      })
      .then((res) => {
        expect(res.status).toBe(201);
        medicoId = res.body.data.medico_id;
        expect(medicoId).toBeDefined();

        // ── 3. El médico agrega especialidad... ──────────────────────────────
        // La búsqueda sólo devuelve médicos con servicios; sin especialidad no aparece.
        return request(app)
          .post(`/medico/${medicoId}/especialidades`)
          .set(medAuth(medicoId))
          .send({ codigo: 'CARD', nombre: 'Cardiología', duracionTurnoEnMins: 30, costo: 5000 });
      })
      .then((res) => {
        expect(res.status).toBe(201);

        // ── ...y define su disponibilidad ────────────────────────────────────
        return request(app)
          .post(`/medico/${medicoId}/disponibilidad`)
          .set(medAuth(medicoId))
          .send({ fecha: FECHA, horaDesde: '09:00', horaHasta: '17:00' });
      })
      .then((res) => {
        expect(res.status).toBe(201);

        // ── 4. El paciente se registra... ────────────────────────────────────
        return request(app)
          .post('/auth/registro')
          .send({
            usuario:    'juantest',
            password:   '1234',
            dni:        '12345678',
            nombre:     'Juan Test',
            obraSocial: 'OSDE',
            plan:       { nombre: '310', coberturaGeneral: 80 },
          });
      })
      .then((res) => {
        expect(res.status).toBe(201);
        pacienteId = res.body.data.usuario.paciente_id;
        expect(pacienteId).toBeDefined();

        // ── ...y luego inicia sesión ─────────────────────────────────────────
        return request(app)
          .post('/auth/login')
          .send({ rol: 'paciente', usuario: 'juantest', password: '1234' });
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.tipo).toBe('PACIENTE');
        pacAuth = { Authorization: `Bearer ${res.body.data.token}` };

        // ── 5. El paciente busca turnos disponibles ──────────────────────────
        return request(app)
          .get('/turno/buscar')
          .query({
            pacienteId,
            especialidad: 'Cardiología',
            fechaDesde:   '2030-12-14',
            fechaHasta:   '2030-12-16',
          })
          .set(pacAuth);
      })
      .then((res) => {
        expect(res.status).toBe(200);
        const dia = res.body.data.find((d) => d.fecha === FECHA);
        expect(dia).toBeDefined();
        expect(dia.turnos.length).toBeGreaterThan(0);
        expect(dia.turnos.some((t) => t.hora === '09:00')).toBe(true);

        // ── 6. El paciente reserva el turno de las 09:00 ─────────────────────
        return request(app)
          .post(`/paciente/${pacienteId}/turno`)
          .set(pacAuth)
          .send({ medicoId, fecha: FECHA, hora: '09:00', duracion: 30 });
      })
      .then((res) => {
        expect(res.status).toBe(201);
        const turno = res.body.data;
        turnoId = turno.turno_id;
        expect(turnoId).toBeDefined();
        expect(turno.estado).toBe('reservado');
        expect(turno.snapshotMedico.nombre).toBe('Dr. García');
        expect(turno.snapshotPaciente.nombre).toBe('Juan Test');

        // ── 7. El turno quedó persistido: historial del paciente... ──────────
        return request(app)
          .get(`/paciente/${pacienteId}/turnos`)
          .set(pacAuth);
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].hora).toBe('09:00');

        // ── ...y agenda del médico ───────────────────────────────────────────
        return request(app)
          .get(`/medico/${medicoId}/turnos`)
          .set(medAuth(medicoId));
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].estado).toBe('reservado');

        // ── 8. El paciente solicita cambiar la fecha a las 11:00 ─────────────
        return request(app)
          .post(`/paciente/${pacienteId}/turnos/${turnoId}/solicitar-cambio`)
          .set(pacAuth)
          .send({ nuevaFecha: FECHA, nuevaHora: '11:00' });
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.estado).toBe('pendiente_cambio');

        // ── 9. El médico confirma el cambio → reservado con la nueva hora ────
        return request(app)
          .patch(`/medico/${medicoId}/turnos/${turnoId}/confirmar-cambio`)
          .set(medAuth(medicoId));
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.estado).toBe('reservado');
        expect(res.body.data.hora).toBe('11:00');

        // Verificación final desde la agenda del médico: un único turno, ya movido.
        return request(app)
          .get(`/medico/${medicoId}/turnos`)
          .set(medAuth(medicoId));
      })
      .then((res) => {
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].hora).toBe('11:00');
        expect(res.body.data[0].estado).toBe('reservado');
      });
  });
});
