import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

export const getPaciente = (id) =>
  api.get(`/paciente/${id}`).then((r) => r.data.data);

// --- Listados (GetAll) -----------------------------------------------------
export const getAllMedicos = () =>
  api.get('/medico').then((r) => r.data.data);

export const getAllPacientes = () =>
  api.get('/paciente').then((r) => r.data.data);

export const getAllSedes = () =>
  api.get('/sede').then((r) => r.data.data);

export const buscarTurnos = (params) =>
  api.get('/turno/buscar', { params }).then((r) => r.data.data);

export const getTurnosPaciente = (pacienteId) =>
  api.get(`/paciente/${pacienteId}/turnos`).then((r) => r.data.data);

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
