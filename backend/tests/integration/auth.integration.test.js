import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { iniciarDB, detenerDB, limpiarColecciones } from './setup.js';

beforeAll(iniciarDB);
afterAll(detenerDB);
afterEach(limpiarColecciones);

const PACIENTE_BASE = {
  usuario:    'juantest',
  password:   '1234',
  dni:        '12345678',
  nombre:     'Juan Test',
  obraSocial: 'OSDE',
  plan:       { nombre: '310', coberturaGeneral: 80 },
};

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
describe('POST /auth/login', () => {
  it('admin puede iniciar sesión con credenciales correctas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ rol: 'admin', usuario: 'admin', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.tipo).toBe('ADMIN');
  });

  it('rechaza login de admin con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ rol: 'admin', usuario: 'admin', password: 'equivocada' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('fail');
  });

  it('rechaza login de paciente que no existe', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ rol: 'paciente', usuario: 'noexiste', password: '1234' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('fail');
  });

  it('paciente puede iniciar sesión tras registrarse', async () => {
    await request(app).post('/auth/registro').send(PACIENTE_BASE);

    const res = await request(app)
      .post('/auth/login')
      .send({ rol: 'paciente', usuario: 'juantest', password: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.data.tipo).toBe('PACIENTE');
    expect(res.body.data.token).toBeDefined();
  });

  it('rechaza login sin body', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /auth/registro
// ---------------------------------------------------------------------------
describe('POST /auth/registro', () => {
  it('crea un paciente y devuelve una sesión activa', async () => {
    const res = await request(app)
      .post('/auth/registro')
      .send(PACIENTE_BASE);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.tipo).toBe('PACIENTE');
    expect(res.body.data.usuario.nombre).toBe('Juan Test');
    expect(res.body.data.usuario.paciente_id).toBeDefined();
  });

  it('rechaza el registro si el DNI ya está registrado', async () => {
    await request(app).post('/auth/registro').send(PACIENTE_BASE);

    const res = await request(app)
      .post('/auth/registro')
      .send({ ...PACIENTE_BASE, usuario: 'otrousuario' });

    expect(res.status).toBe(409);
  });

  it('rechaza el registro con datos inválidos (DNI malformado)', async () => {
    const res = await request(app)
      .post('/auth/registro')
      .send({ ...PACIENTE_BASE, dni: 'abc' });

    expect(res.status).toBe(400);
  });

  it('rechaza el registro sin contraseña', async () => {
    const { password: _, ...sinPassword } = PACIENTE_BASE;
    const res = await request(app).post('/auth/registro').send(sinPassword);

    expect(res.status).toBe(400);
  });
});
