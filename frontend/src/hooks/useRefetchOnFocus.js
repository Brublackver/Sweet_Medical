'use client';
import { useEffect } from 'react';

/*
  useRefetchOnFocus — vuelve a ejecutar `cargar` cuando la pestaña recupera el foco.

  Caso de uso: una vista muestra datos que OTRA persona puede cambiar del lado del
  servidor (p.ej. el médico resuelve un cambio mientras el paciente mira su lista de
  turnos). Sin websockets, refrescar al volver a la pestaña mantiene la vista
  consistente sin tráfico constante: cubre el caso real (el usuario vuelve a mirar)
  sin pollear cada pocos segundos.

  `cargar` debe ser ESTABLE (envolvelo en useCallback) para no re-suscribir el
  listener en cada render.
*/
export function useRefetchOnFocus(cargar) {
  useEffect(() => {
    const onFocus = () => cargar();
    const onVisible = () => {
      if (document.visibilityState === 'visible') cargar();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [cargar]);
}
