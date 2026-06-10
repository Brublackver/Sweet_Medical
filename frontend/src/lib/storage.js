export const leerStorage = (clave) => {
  try {
    const stored = localStorage.getItem(clave);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(clave);
    return null;
  }
};
