'use client';
import { createContext, useContext, useState } from 'react';

const CarritoContext = createContext(null);

const computarKey = (turno) =>
  `${turno.medico.id}-${turno.fecha}-${turno.hora}`;

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregar = (turno) => {
    const key = computarKey(turno);
    setItems((prev) => {
      if (prev.some((i) => i.key === key)) return prev;
      return [...prev, { ...turno, key }];
    });
  };

  const quitar = (key) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const estaAgregado = (turno) => {
    const key = computarKey(turno);
    return items.some((i) => i.key === key);
  };

  const quitarTurno = (turno) => quitar(computarKey(turno));

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
