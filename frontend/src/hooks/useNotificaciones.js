'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getNotificaciones, marcarNotificacionLeida,
  confirmarPropuestaMedico, rechazarPropuestaMedico,
  confirmarCambioPaciente,  rechazarCambioPaciente,
} from '@/lib/api';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';

/*
  useNotificaciones — única fuente de verdad para la lógica de notificaciones.

  La campana (aviso en la navbar) y la página dedicada de Notificaciones
  consumen este hook. Centralizar acá evita duplicar la regla de "qué es
  accionable" y "cómo se responde" en dos lugares distintos.

  Params:
    usuarioTipo → "MEDICO" | "PACIENTE"
    usuarioId   → id del usuario logueado

  Devuelve:
    notificaciones, sinLeer, cantidad, error, procesandoId,
    cargar(), marcarLeida(id), responder(notif, aceptar), esAccionable(notif)
*/
export function useNotificaciones(usuarioTipo, usuarioId) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [procesandoId, setProcesandoId]     = useState(null);
  const [error, setError]                   = useState('');

  const cargar = useCallback(() => {
    if (!usuarioId) return;
    getNotificaciones(usuarioTipo, usuarioId)
      .then(setNotificaciones)
      .catch(() => { /* silencioso: una falla acá no debe romper la navegación */ });
  }, [usuarioTipo, usuarioId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Si la otra parte resuelve un cambio mientras esta pestaña está abierta,
  // al volver a ella refrescamos para que el contador y la lista reflejen el estado real.
  useRefetchOnFocus(cargar);

  // Escucha el evento que disparan las tarjetas de turno al aceptar/rechazar,
  // para que el badge del Navbar se actualice inmediatamente sin cambiar de pestaña.
  useEffect(() => {
    const handler = () => cargar();
    window.addEventListener('notif-actualizada', handler);
    return () => window.removeEventListener('notif-actualizada', handler);
  }, [cargar]);

  const sinLeer  = notificaciones.filter((n) => !n.leida);
  const cantidad = sinLeer.length;

  const marcarLeida = useCallback((notificacionId, resultado = null) => {
    // Optimista: la pintamos como leída (y resuelta) ya, y confirmamos contra el backend.
    setNotificaciones((prev) =>
      prev.map((n) =>
        n.notificacion_id === notificacionId
          ? { ...n, leida: true, ...(resultado ? { resultado } : {}) }
          : n
      )
    );
    marcarNotificacionLeida(usuarioTipo, usuarioId, notificacionId, resultado).catch(cargar);
  }, [usuarioTipo, usuarioId, cargar]);

  // Una notificación es accionable si refiere a un turno (turno_id) y es del
  // tipo que ESTE usuario puede resolver: el paciente decide sobre las PROPUESTAS
  // del médico; el médico decide sobre las SOLICITUDES del paciente.
  const esAccionable = useCallback((n) =>
    !n.leida && n.turno_id != null && (
      (usuarioTipo === 'PACIENTE' && n.tipo === 'PROPUESTA_CAMBIO_FECHA') ||
      (usuarioTipo === 'MEDICO'   && n.tipo === 'SOLICITUD_CAMBIO_FECHA')
    ), [usuarioTipo]);

  // Acepta o rechaza el cambio. Reusa los MISMOS endpoints que las tarjetas de
  // turno — acá sólo cambia desde dónde se dispara la acción.
  const responder = useCallback((n, aceptar) => {
    const accion = usuarioTipo === 'PACIENTE'
      ? (aceptar ? confirmarPropuestaMedico : rechazarPropuestaMedico)
      : (aceptar ? confirmarCambioPaciente  : rechazarCambioPaciente);

    setError('');
    setProcesandoId(n.notificacion_id);
    return accion(usuarioId, n.turno_id)
      // Resuelto → queda registrado como aceptado/rechazado (persistente).
      .then(() => marcarLeida(n.notificacion_id, aceptar ? 'ACEPTADO' : 'RECHAZADO'))
      .catch((e) => setError(e.response?.data?.message || 'No se pudo procesar. Quizás ya fue resuelto.'))
      .finally(() => setProcesandoId(null));
  }, [usuarioTipo, usuarioId, marcarLeida]);

  return {
    notificaciones, sinLeer, cantidad, error, procesandoId,
    cargar, marcarLeida, responder, esAccionable,
  };
}
