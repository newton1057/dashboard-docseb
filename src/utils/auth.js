const SESSION_STORAGE_KEY = "docsebAuthTimestamp";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const getStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
};

export const markSessionStart = () => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(SESSION_STORAGE_KEY, String(Date.now()));
  } catch (error) {
    console.error("No se pudo registrar la sesión:", error);
  }
};

export const clearSession = () => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("No se pudo limpiar la sesión:", error);
  }
};

export const isSessionValid = () => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const timestamp = Number(storage.getItem(SESSION_STORAGE_KEY));
    if (!timestamp) return false;
    return Date.now() - timestamp <= SESSION_DURATION_MS;
  } catch (error) {
    console.error("No se pudo validar la sesión:", error);
    return false;
  }
};
