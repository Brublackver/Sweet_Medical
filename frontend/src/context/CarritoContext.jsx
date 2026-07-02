'use client';
import { createContext, useContext, useState } from 'react';

const CarritoContext = createContext(null);

// Identifica el slot (médico + fecha + hora). Un médico solo puede atender
// un paciente por slot, independientemente del servicio.
const computarSlotKey = (turno) =>
  `${turno.medico.id}-${turno.fecha}-${turno.hora}`;

// Identifica el ítem exacto. Usa tipo+codigo porque el id de especialidades y prácticas
// son contadores independientes (ambos empiezan en 1), por lo que id solo no es único.
const computarItemKey = (turno) =>
  `${turno.medico.id}-${turno.fecha}-${turno.hora}-${turno.servicio?.tipo ?? ''}-${turno.servicio?.codigo ?? ''}`;

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregar = (turno) => {
    // Chequeo previo al updater: solo avisamos si el turno REALMENTE se va a agregar
    // (si el slot ya estaba ocupado no se agrega, así que tampoco se notifica).
    const yaOcupado = items.some((i) => computarSlotKey(i) === computarSlotKey(turno));
    if (yaOcupado) return;

    setItems((prev) => {
      // Rechaza si el slot ya está ocupado (evita doble reserva en mismo horario)
      if (prev.some((i) => computarSlotKey(i) === computarSlotKey(turno))) return prev;
      return [...prev, { ...turno, key: computarItemKey(turno) }];
    });

    // Aviso desacoplado (toast + indicadores). El emisor no conoce la UI que escucha.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('turno-solicitado', {
        detail: {
          mensaje: `Turno solicitado${turno.servicio?.nombre ? `: ${turno.servicio.nombre}` : ''}`,
          href:    '/solicitudes',
        },
      }));
    }
  };

  const quitar = (key) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const estaAgregado = (turno) =>
    items.some((i) => i.key === computarItemKey(turno));

  const quitarTurno = (turno) => quitar(computarItemKey(turno));

  const vaciar = () => setItems([]);

  return (
    <CarritoContext.Provider value={{ items, agregar, quitar, quitarTurno, estaAgregado, vaciar }}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  return useContext(CarritoContext);
}
