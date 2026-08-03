import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { firmarToken } from '../../auth/jwt.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

/*
  TEST DE INTEGRACIÓN — Fila de espera (aviso de disponibilidad).

  Recorre el circuito completo y real, sin mockear ninguna capa:

    1. El paciente busca turnos de una especialidad y NO hay nada.
    2. Se suscribe al aviso con esos mismos filtros.
    3. El médico abre disponibilidad para esa fecha.
    4. El sistema reevalúa la fila de espera con la MISMA búsqueda del paso 1
       y le genera una notificación al paciente.

  La evaluación se dispara en modo fire-and-forget (no puede demorar ni romper
  la operación que la disparó), así que el test espera por el efecto en vez de
  asumir que ya ocurrió cuando responde el HTTP.
*/

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const adminAuth = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const medAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'MEDICO', id })}` });
const pacAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'PACIENTE', id })}` });

const FECHA = '2030-12-15';

// ── Siembra ──────────────────────────────────────────────────────────────────

const crearMedicoConEspecialidad = () =>
  request(app)
    .post('/medico')
    .set(adminAuth())
    .send({ usuario: 'drcardio', password: '1234', nombre: 'Dra. Ruiz', matricula: 'M99887' })
    .then((r) => {
      const medico = r.body.data;
      return request(app)
        .post(`/medico/${medico.medico_id}/especialidades`)
        .set(medAuth(medico.medico_id))
        .send({ codigo: 'CARD', nombre: 'Cardiología', duracionTurnoEnMins: 30, costo: 10000 })
        .then(() => medico);
    });

const registrarPaciente = () =>
  request(app)
    .post('/auth/registro')
    .send({
      usuario: 'anatest', password: '1234', dni: '87654321', nombre: 'Ana Test',
      obraSocial: 'OSDE', plan: { nombre: '310', coberturaGeneral: 80 },
    })
    .then((r) => r.body.data.usuario);

// Espera a que aparezca la notificación del aviso. El disparo es asíncrono por
// diseño: reintenta un rato corto en vez de dormir un tiempo fijo.
const esperarNotificacion = (pacienteId, intentos = 25) =>
  request(app)
    .get(`/paciente/${pacienteId}/notificaciones`)
    .set(pacAuth(pacienteId))
    .then((res) => {
      const avisos = res.body.data.filter((n) => n.tipo === 'TURNO_DISPONIBLE');
      if (avisos.length > 0 || intentos === 0) return avisos;
      return new Promise((resolve) => setTimeout(resolve, 100))
        .then(() => esperarNotificacion(pacienteId, intentos - 1));
    });

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Fila de espera — del aviso a la notificación', () => {

  it('avisa al paciente cuando el médico abre disponibilidad que coincide con su búsqueda', () => {
    let medico;
    let paciente;

    return crearMedicoConEspecialidad()
      .then((m) => { medico = m; return registrarPaciente(); })
      .then((p) => {
        paciente = p;

        // 1. Búsqueda sin resultados: el médico todavía no tiene agenda abierta.
        return request(app)
          .get('/turno/buscar')
          .set(pacAuth(paciente.paciente_id))
          .query({
            pacienteId: paciente.paciente_id, especialidad: 'Cardiología',
            fechaDesde: FECHA, fechaHasta: FECHA,
          });
      })
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);

        // 2. El paciente se anota en la fila de espera con esos mismos filtros.
        return request(app)
          .post(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id))
          .send({ especialidad: 'Cardiología', fechaDesde: FECHA, fechaHasta: FECHA });
      })
      .then((res) => {
        expect(res.status).toBe(201);
        expect(res.body.data.estado).toBe('ACTIVO');
        expect(res.body.data.descripcion).toBe('Cardiología');

        // 3. El médico abre agenda justo para esa fecha.
        return request(app)
          .post(`/medico/${medico.medico_id}/disponibilidad`)
          .set(medAuth(medico.medico_id))
          .send({ fecha: FECHA, horaDesde: '09:00', horaHasta: '17:00' });
      })
      .then((res) => {
        expect(res.status).toBe(201);
        // 4. La fila de espera reevalúa y notifica.
        return esperarNotificacion(paciente.paciente_id);
      })
      .then((avisos) => {
        expect(avisos).toHaveLength(1);
        expect(avisos[0].mensaje).toMatch(/Cardiología/);
        expect(avisos[0].mensaje).toMatch(new RegExp(FECHA));

        // El aviso queda cumplido: sale de la cola de espera.
        return request(app)
          .get(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id));
      })
      .then((res) => {
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].estado).toBe('NOTIFICADO');
        expect(res.body.data[0].fechaAviso).not.toBeNull();
      });
  });

  it('NO avisa si la disponibilidad nueva no coincide con los filtros del aviso', () => {
    let medico;
    let paciente;

    return crearMedicoConEspecialidad()
      .then((m) => { medico = m; return registrarPaciente(); })
      .then((p) => {
        paciente = p;
        // El paciente espera Dermatología; el médico solo hace Cardiología.
        return request(app)
          .post(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id))
          .send({ especialidad: 'Dermatología', fechaDesde: FECHA, fechaHasta: FECHA });
      })
      .then(() =>
        request(app)
          .post(`/medico/${medico.medico_id}/disponibilidad`)
          .set(medAuth(medico.medico_id))
          .send({ fecha: FECHA, horaDesde: '09:00', horaHasta: '17:00' })
      )
      .then(() => esperarNotificacion(paciente.paciente_id, 5))
      .then((avisos) => {
        expect(avisos).toHaveLength(0);
        return request(app)
          .get(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id));
      })
      .then((res) => expect(res.body.data[0].estado).toBe('ACTIVO'));
  });

  it('la cancelación de un turno libera el slot y dispara el aviso', () => {
    let medico;
    let pacienteQueCancela;
    let pacienteEnEspera;

    return crearMedicoConEspecialidad()
      .then((m) => {
        medico = m;
        // Agenda de UN solo slot de 30': si se ocupa, no queda nada libre.
        return request(app)
          .post(`/medico/${medico.medico_id}/disponibilidad`)
          .set(medAuth(medico.medico_id))
          .send({ fecha: FECHA, horaDesde: '09:00', horaHasta: '09:30' });
      })
      .then(() => registrarPaciente())
      .then((p) => {
        pacienteQueCancela = p;
        return request(app)
          .post(`/paciente/${p.paciente_id}/turno`)
          .set(pacAuth(p.paciente_id))
          .send({ medicoId: medico.medico_id, fecha: FECHA, hora: '09:00', duracion: 30 });
      })
      .then((res) => {
        expect(res.status).toBe(201);
        // Segundo paciente: busca, no encuentra nada y se anota en la fila.
        return request(app)
          .post('/auth/registro')
          .send({
            usuario: 'brunotest', password: '1234', dni: '11223344', nombre: 'Bruno Test',
            obraSocial: 'OSDE', plan: { nombre: '310', coberturaGeneral: 80 },
          })
          .then((r) => r.body.data.usuario);
      })
      .then((p) => {
        pacienteEnEspera = p;
        return request(app)
          .get('/turno/buscar')
          .set(pacAuth(p.paciente_id))
          .query({
            pacienteId: p.paciente_id, especialidad: 'Cardiología',
            fechaDesde: FECHA, fechaHasta: FECHA,
          });
      })
      .then((res) => {
        // El único slot está tomado.
        expect(res.body.data).toEqual([]);
        return request(app)
          .post(`/paciente/${pacienteEnEspera.paciente_id}/avisos`)
          .set(pacAuth(pacienteEnEspera.paciente_id))
          .send({ especialidad: 'Cardiología', fechaDesde: FECHA, fechaHasta: FECHA });
      })
      .then(() =>
        // El primer paciente cancela → el slot vuelve a estar libre.
        request(app)
          .get(`/paciente/${pacienteQueCancela.paciente_id}/turnos`)
          .set(pacAuth(pacienteQueCancela.paciente_id))
      )
      .then((res) => {
        const turnoId = res.body.data[0].turno_id;
        return request(app)
          .patch(`/paciente/${pacienteQueCancela.paciente_id}/turnos/${turnoId}/cancelar`)
          .set(pacAuth(pacienteQueCancela.paciente_id))
          .send({ motivo: 'Me surgió un imprevisto' });
      })
      .then((res) => {
        expect(res.status).toBe(200);
        return esperarNotificacion(pacienteEnEspera.paciente_id);
      })
      .then((avisos) => {
        expect(avisos).toHaveLength(1);
        expect(avisos[0].mensaje).toMatch(/Cardiología/);
      });
  });

  it('no duplica el aviso y permite darlo de baja', () => {
    let paciente;

    return registrarPaciente()
      .then((p) => {
        paciente = p;
        return request(app)
          .post(`/paciente/${p.paciente_id}/avisos`)
          .set(pacAuth(p.paciente_id))
          .send({ especialidad: 'Cardiología' });
      })
      .then((res) => {
        const primerId = res.body.data.aviso_id;
        // Mismo pedido, distinta capitalización: debe devolver el MISMO aviso.
        return request(app)
          .post(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id))
          .send({ especialidad: 'cardiología' })
          .then((r2) => {
            expect(r2.body.data.aviso_id).toBe(primerId);
            return primerId;
          });
      })
      .then((avisoId) =>
        request(app)
          .get(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id))
          .then((res) => {
            expect(res.body.data).toHaveLength(1);
            return avisoId;
          })
      )
      .then((avisoId) =>
        request(app)
          .delete(`/paciente/${paciente.paciente_id}/avisos/${avisoId}`)
          .set(pacAuth(paciente.paciente_id))
      )
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.data.estado).toBe('CANCELADO');
        return request(app)
          .get(`/paciente/${paciente.paciente_id}/avisos`)
          .set(pacAuth(paciente.paciente_id))
          .query({ estado: 'ACTIVO' });
      })
      .then((res) => expect(res.body.data).toEqual([]));
  });

  it('un paciente no puede ver ni cancelar los avisos de otro', () => {
    let victima;

    return registrarPaciente()
      .then((p) => {
        victima = p;
        return request(app)
          .post(`/paciente/${p.paciente_id}/avisos`)
          .set(pacAuth(p.paciente_id))
          .send({ especialidad: 'Cardiología' });
      })
      .then((res) => {
        const avisoId = res.body.data.aviso_id;
        const intruso = victima.paciente_id + 99;
        // Con su propio token, apuntando al recurso de otro: lo corta requireOwnership.
        return request(app)
          .delete(`/paciente/${victima.paciente_id}/avisos/${avisoId}`)
          .set(pacAuth(intruso));
      })
      .then((res) => expect(res.status).toBe(403));
  });
});
