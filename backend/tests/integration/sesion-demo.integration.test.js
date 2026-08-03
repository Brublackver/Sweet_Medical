import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request  from 'supertest';
import app      from '../../app.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';
import { ObraSocialRepository } from '../../repositories/ObraSocialRepository.js';
import PacienteModel from '../../models/PacienteModel.js';
import TurnoModel    from '../../models/TurnoModel.js';
import { firmarToken } from '../../auth/jwt.js';

/*
  TEST DE INTEGRACIÓN — Cuenta de prueba sin registro (POST /auth/demo).

  Recorre el stack completo: ruta pública → AuthController → AuthService →
  PacienteDemoService → PacienteRepository → MongoDB. Sin mocks.

  Lo que importa verificar acá es que el invitado sea un paciente de VERDAD:
  que el token que recibe sirva para operar la app igual que cualquier otro, y
  que al vencer no deje basura atrás.
*/

const obraSocialRepository = new ObraSocialRepository();

beforeAll(() => iniciarDB().then(() => obraSocialRepository.inicializar()));
afterAll(detenerDB);
afterEach(() =>
  limpiarColecciones().then(() => obraSocialRepository.inicializar())
);

const adminAuth = () => ({ Authorization: `Bearer ${firmarToken({ tipo: 'ADMIN', id: 0 })}` });
const pacAuth   = (id) => ({ Authorization: `Bearer ${firmarToken({ tipo: 'PACIENTE', id })}` });

const crearDemo = () => request(app).post('/auth/demo').then((r) => r.body.data);

describe('POST /auth/demo — cuenta de prueba', () => {

  it('crea la sesión sin body ni credenciales y devuelve el mismo shape que login', () =>
    request(app).post('/auth/demo').then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');

      const { token, tipo, usuario } = res.body.data;
      expect(token).toBeDefined();
      expect(tipo).toBe('PACIENTE');
      expect(usuario.es_demo).toBe(true);
      expect(usuario.paciente_id).toBeDefined();
      expect(usuario.minutos_restantes).toBeGreaterThan(0);
    }));

  it('le asigna obra social y plan del catálogo real', () =>
    crearDemo().then(({ usuario }) => {
      expect(['OSDE', 'Swiss Medical']).toContain(usuario.obraSocial);
      expect(usuario.plan).not.toBeNull();
      // Se prefiere cobertura parcial: es la que muestra el cálculo en la búsqueda.
      expect(usuario.plan.coberturaGeneral).toBeGreaterThan(0);
      expect(usuario.plan.coberturaGeneral).toBeLessThan(100);
    }));

  it('nunca expone el hash de la contraseña', () =>
    crearDemo().then(({ usuario }) => {
      expect(usuario.password).toBeUndefined();
    }));

  it('dos invitados no se pisan entre sí', () =>
    Promise.all([crearDemo(), crearDemo()]).then(([a, b]) => {
      expect(a.usuario.paciente_id).not.toBe(b.usuario.paciente_id);
      expect(a.usuario.dni).not.toBe(b.usuario.dni);
    }));

  it('el token del invitado sirve para operar como paciente', () =>
    crearDemo().then(({ token, usuario }) =>
      request(app)
        .get(`/paciente/${usuario.paciente_id}/turnos`)
        .set({ Authorization: `Bearer ${token}` })
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body.data).toEqual([]);
        })
    ));

  it('el invitado puede anotarse en la fila de espera', () =>
    crearDemo().then(({ token, usuario }) =>
      request(app)
        .post(`/paciente/${usuario.paciente_id}/avisos`)
        .set({ Authorization: `Bearer ${token}` })
        .send({ especialidad: 'Cardiología' })
        .then((res) => {
          expect(res.status).toBe(201);
          expect(res.body.data.estado).toBe('ACTIVO');
        })
    ));

  it('sigue respetando el aislamiento entre cuentas: no puede ver las de otro', () =>
    Promise.all([crearDemo(), crearDemo()]).then(([a, b]) =>
      request(app)
        .get(`/paciente/${b.usuario.paciente_id}/turnos`)
        .set({ Authorization: `Bearer ${a.token}` })
        .then((res) => expect(res.status).toBe(403))
    ));

  it('aparece en el listado de pacientes marcado como demo', () =>
    crearDemo().then(({ usuario }) =>
      request(app).get('/paciente').set(adminAuth()).then((res) => {
        const encontrado = res.body.data.find((p) => p.paciente_id === usuario.paciente_id);
        expect(encontrado.es_demo).toBe(true);
        expect(encontrado.expira_en).not.toBeNull();
      })
    ));
});

describe('Barrido de cuentas de prueba vencidas', () => {

  it('al crear una cuenta nueva borra las vencidas junto con sus turnos', () => {
    let vencidoId;

    return crearDemo()
      .then(({ usuario }) => {
        vencidoId = usuario.paciente_id;
        // Se le inventa un turno para comprobar que el barrido se lo lleva.
        return TurnoModel.create({
          turnoId: 9999, medicoId: 1, pacienteId: vencidoId,
          fecha: '2030-01-01', hora: '09:00', duracion: 30,
          estado: 'reservado', fechaCreacion: new Date().toISOString(),
        });
      })
      // Se fuerza el vencimiento moviéndole la fecha al pasado.
      .then(() => PacienteModel.updateOne(
        { pacienteId: vencidoId },
        { expiraEn: new Date(Date.now() - 60000) }
      ))
      // Un invitado nuevo dispara la limpieza.
      .then(() => crearDemo())
      .then(({ usuario }) => {
        expect(usuario.paciente_id).not.toBe(vencidoId);
        return Promise.all([
          PacienteModel.findOne({ pacienteId: vencidoId }),
          TurnoModel.find({ pacienteId: vencidoId }),
        ]);
      })
      .then(([paciente, turnos]) => {
        expect(paciente).toBeNull();
        expect(turnos).toHaveLength(0);
      });
  });

  it('NO toca las cuentas de pacientes reales, aunque sean viejas', () => {
    let realId;

    return request(app)
      .post('/auth/registro')
      .send({
        usuario: 'realtest', password: '1234', dni: '33445566', nombre: 'Real Test',
        obraSocial: 'OSDE', plan: { nombre: '310', coberturaGeneral: 50 },
      })
      .then((r) => {
        realId = r.body.data.usuario.paciente_id;
        // Aunque tuviera una fecha de vencimiento vieja, no es demo: no se toca.
        return PacienteModel.updateOne(
          { pacienteId: realId },
          { expiraEn: new Date(Date.now() - 60000) }
        );
      })
      .then(() => crearDemo())
      .then(() => PacienteModel.findOne({ pacienteId: realId }))
      .then((paciente) => {
        expect(paciente).not.toBeNull();
        expect(paciente.esDemo).toBe(false);
      });
  });

  it('una cuenta vigente sobrevive al barrido', () =>
    crearDemo()
      .then(({ usuario }) => crearDemo().then(() => usuario.paciente_id))
      .then((id) => PacienteModel.findOne({ pacienteId: id }))
      .then((paciente) => expect(paciente).not.toBeNull()));
});
