import axios from 'axios';

const api = axios.create({
  baseURL: '/backend',
});

const TOKEN_KEY = 'token';

// --- Sesión / token --------------------------------------------------------
export const guardarToken = (token) => {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
};
export const limpiarToken = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
};

// Adjunta el Bearer token en cada request si hay sesión activa.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login real: el backend valida usuario+contraseña y devuelve { token, tipo, usuario }.
export const login = (rol, usuario, password) =>
  api.post('/auth/login', { rol, usuario, password }).then((r) => r.data.data);

// Auto-registro público de paciente. Crea la cuenta y devuelve la sesión ya
// iniciada { token, tipo, usuario } — mismo shape que login.
export const registrarPaciente = (datos) =>
  api.post('/auth/registro', datos).then((r) => r.data.data);

export const getPaciente = (id) =>
  api.get(`/paciente/${id}`).then((r) => r.data.data);

// --- Listados (GetAll) -----------------------------------------------------
export const getAllMedicos = () =>
  api.get('/medico').then((r) => r.data.data);

export const getAllPacientes = () =>
  api.get('/paciente').then((r) => r.data.data);

export const getAllSedes = () =>
  api.get('/sede').then((r) => r.data.data);

// Catálogo de obras sociales con sus planes, estado y suscripción.
// filtros opcionales: { activa: true|false, vigente: true|false }
export const getAllObrasSociales = (filtros) =>
  api.get('/obra-social', { params: filtros }).then((r) => r.data.data);

export const buscarTurnos = (params) =>
  api.get('/turno/buscar', { params }).then((r) => r.data.data);

export const getTurnosPaciente = (pacienteId) =>
  api.get(`/paciente/${pacienteId}/turnos`).then((r) => r.data.data);

// Próximos turnos: el backend los devuelve ya ordenados (ascendente) y sin los
// que ya pasaron. El cliente recibe la lista lista para mostrar.
export const getProximosTurnosPaciente = (pacienteId) =>
  api.get(`/paciente/${pacienteId}/turnos`, { params: { proximos: true } }).then((r) => r.data.data);

export const reservarTurno = (pacienteId, datos) =>
  api.post(`/paciente/${pacienteId}/turno`, datos).then((r) => r.data.data);

export const getMedico = (id) =>
  api.get(`/medico/${id}`).then((r) => r.data.data);

export const confirmarPropuestaMedico = (pacienteId, turnoId) =>
  api.patch(`/paciente/${pacienteId}/turnos/${turnoId}/confirmar-propuesta`).then((r) => r.data.data);

export const rechazarPropuestaMedico = (pacienteId, turnoId) =>
  api.patch(`/paciente/${pacienteId}/turnos/${turnoId}/rechazar-propuesta`).then((r) => r.data.data);

export const solicitarCambioFecha = (pacienteId, turnoId, nuevaFecha, nuevaHora) =>
  api.post(`/paciente/${pacienteId}/turnos/${turnoId}/solicitar-cambio`, { nuevaFecha, nuevaHora }).then((r) => r.data.data);

// Desenlace del turno pasado, respondido por el paciente:
//   confirmarAtencion  → SÍ fui atendido  → turno REALIZADO
//   reportarNoAtencion → NO fui atendido  → turno NO_REALIZADO
export const confirmarAtencion = (pacienteId, turnoId) =>
  api.patch(`/paciente/${pacienteId}/turnos/${turnoId}/confirmar-atencion`).then((r) => r.data.data);

export const reportarNoAtencion = (pacienteId, turnoId) =>
  api.patch(`/paciente/${pacienteId}/turnos/${turnoId}/no-atencion`).then((r) => r.data.data);

// --- Médico ----------------------------------------------------------------
export const getTurnosMedico = (medicoId) =>
  api.get(`/medico/${medicoId}/turnos`).then((r) => r.data.data);

export const cancelarTurnoMedico = (medicoId, turnoId, motivo) =>
  api.patch(`/medico/${medicoId}/turnos/${turnoId}/cancelar`, { motivo }).then((r) => r.data.data);

export const marcarRealizado = (medicoId, turnoId) =>
  api.patch(`/medico/${medicoId}/turnos/${turnoId}/realizado`).then((r) => r.data.data);

export const proponerCambio = (medicoId, turnoId, nuevaFecha, nuevaHora) =>
  api.post(`/medico/${medicoId}/turnos/${turnoId}/proponer-cambio`, { nuevaFecha, nuevaHora }).then((r) => r.data.data);

export const confirmarCambioPaciente = (medicoId, turnoId) =>
  api.patch(`/medico/${medicoId}/turnos/${turnoId}/confirmar-cambio`).then((r) => r.data.data);

export const rechazarCambioPaciente = (medicoId, turnoId) =>
  api.patch(`/medico/${medicoId}/turnos/${turnoId}/rechazar-cambio`).then((r) => r.data.data);

export const getDisponibilidad = (medicoId) =>
  api.get(`/medico/${medicoId}/disponibilidad`).then((r) => r.data.data);

export const definirDisponibilidad = (medicoId, datos) =>
  api.post(`/medico/${medicoId}/disponibilidad`, datos).then((r) => r.data.data);

export const eliminarDisponibilidad = (medicoId, disponibilidadId) =>
  api.delete(`/medico/${medicoId}/disponibilidad/${disponibilidadId}`).then((r) => r.data);

// --- Admin ----------------------------------------------------------------
export const crearMedico = (datos) =>
  api.post('/medico', datos).then((r) => r.data.data);

export const agregarEspecialidadMedico = (medicoId, datos) =>
  api.post(`/medico/${medicoId}/especialidades`, datos).then((r) => r.data.data);

export const eliminarMedico = (medicoId) =>
  api.delete(`/medico/${medicoId}`);

// Reset de contraseña (solo admin). El backend hashea la nueva clave.
export const resetearPasswordMedico = (medicoId, password) =>
  api.patch(`/medico/${medicoId}/password`, { password }).then((r) => r.data);

export const resetearPasswordPaciente = (pacienteId, password) =>
  api.patch(`/paciente/${pacienteId}/password`, { password }).then((r) => r.data);

export const crearPaciente = (datos) =>
  api.post('/paciente', datos).then((r) => r.data.data);

export const eliminarPaciente = (pacienteId) =>
  api.delete(`/paciente/${pacienteId}`);

export const agregarCoberturaEspecialidad = (pacienteId, datos) =>
  api.post(`/paciente/${pacienteId}/plan/especialidades`, datos).then((r) => r.data.data);

export const quitarCoberturaEspecialidad = (pacienteId, codigo) =>
  api.delete(`/paciente/${pacienteId}/plan/especialidades/${codigo}`).then((r) => r.data.data);

export const agregarCoberturaPractica = (pacienteId, datos) =>
  api.post(`/paciente/${pacienteId}/plan/practicas`, datos).then((r) => r.data.data);

export const quitarCoberturaPractica = (pacienteId, codigo) =>
  api.delete(`/paciente/${pacienteId}/plan/practicas/${codigo}`).then((r) => r.data.data);

// --- Notificaciones --------------------------------------------------------
// El recurso está anidado bajo el tipo de usuario: /medico/:id o /paciente/:id.
const baseNotif = (usuarioTipo) => (usuarioTipo === 'MEDICO' ? 'medico' : 'paciente');

// leidas: true → leídas | false → sin leer | undefined → todas
export const getNotificaciones = (usuarioTipo, usuarioId, leidas) =>
  api
    .get(`/${baseNotif(usuarioTipo)}/${usuarioId}/notificaciones`, {
      params: leidas === undefined ? {} : { leidas },
    })
    .then((r) => r.data.data);

// resultado opcional ("ACEPTADO" | "RECHAZADO") deja registrado cómo se resolvió
// una notificación accionable. Sin él, solo la marca como leída.
export const marcarNotificacionLeida = (usuarioTipo, usuarioId, notificacionId, resultado) =>
  api
    .patch(`/${baseNotif(usuarioTipo)}/${usuarioId}/notificaciones/${notificacionId}`, {
      leida: true,
      ...(resultado ? { resultado } : {}),
    })
    .then((r) => r.data.data);

// --- Fila de espera (avisos de disponibilidad) -----------------------------
// El aviso guarda los filtros de una búsqueda que no dio resultados. Cuando
// aparece un turno que coincide, el backend genera una notificación.

// estado opcional: 'ACTIVO' | 'NOTIFICADO' | 'CANCELADO'
export const getAvisosDisponibilidad = (pacienteId, estado) =>
  api
    .get(`/paciente/${pacienteId}/avisos`, { params: estado ? { estado } : {} })
    .then((r) => r.data.data);

export const crearAvisoDisponibilidad = (pacienteId, filtros) =>
  api.post(`/paciente/${pacienteId}/avisos`, filtros).then((r) => r.data.data);

export const cancelarAvisoDisponibilidad = (pacienteId, avisoId) =>
  api.delete(`/paciente/${pacienteId}/avisos/${avisoId}`).then((r) => r.data.data);

// --- Obras sociales: suscripciones (admin) ---------------------------------
export const getObraSocial = (id) =>
  api.get(`/obra-social/${id}`).then((r) => r.data.data);

export const crearObraSocial = (datos) =>
  api.post('/obra-social', datos).then((r) => r.data.data);

export const getEstadoSuscripcion = (id) =>
  api.get(`/obra-social/${id}/suscripcion`).then((r) => r.data.data);

export const registrarSuscripcion = (id, datos) =>
  api.put(`/obra-social/${id}/suscripcion`, datos).then((r) => r.data.data);

export const cambiarEstadoSuscripcion = (id, activa) =>
  api.patch(`/obra-social/${id}/suscripcion/estado`, { activa }).then((r) => r.data.data);

export const cambiarEstadoObraSocial = (id, activa) =>
  api.patch(`/obra-social/${id}/estado`, { activa }).then((r) => r.data.data);

// --- Personal no médico: administración y limpieza (admin) -----------------
// filtros opcionales: { tipo: 'ADMINISTRACION'|'LIMPIEZA', activo: true|false }
export const getAllPersonal = (filtros) =>
  api.get('/personal', { params: filtros }).then((r) => r.data.data);

export const getTiposPersonal = () =>
  api.get('/personal/tipos').then((r) => r.data.data);

export const crearPersonal = (datos) =>
  api.post('/personal', datos).then((r) => r.data.data);

export const actualizarPersonal = (id, datos) =>
  api.put(`/personal/${id}`, datos).then((r) => r.data.data);

export const cambiarEstadoPersonal = (id, activo) =>
  api.patch(`/personal/${id}/estado`, { activo }).then((r) => r.data.data);

export const eliminarPersonal = (id) =>
  api.delete(`/personal/${id}`).then((r) => r.data);
