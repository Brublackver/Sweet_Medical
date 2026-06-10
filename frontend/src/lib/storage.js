export const leerStorage = (clave) => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(clave);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(clave);
    return null;
  }
};
