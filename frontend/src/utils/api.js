import axios from "axios";
import { storage } from "./storage";

// Instancia base de Axios
const api = axios.create({
  baseURL: "http://localhost:3001/api", // tu backend Express
});

// Interceptor para incluir el token JWT en cada request si existe
api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Rutas de autenticación ---
export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),
};

// --- Rutas relacionadas al progreso del jugador ---
export const playerApi = {
  /**
   * Guarda el progreso del jugador en un slot (1–5).
   * Si el slot ya existe para ese user_id, se sobrescribe.
   * @param {Object} saveData - datos a guardar (wave, hp, posición, etc.)
   * @returns {Promise<Object>} Respuesta del servidor
   */
  saveProgress: (saveData) =>
    api.post("/player/save", saveData).then((res) => res.data),

  /**
   * Obtiene todos los guardados del jugador.
   * @param {number} userId - ID del usuario logueado
   * @returns {Promise<Array>} Array de partidas guardadas
   */
  getSaves: (userId) =>
    api.get(`/player/saves/${userId}`).then((res) => res.data),

  /**
   * Obtiene un guardado específico por número de slot.
   * @param {number} userId - ID del usuario
   * @param {number} slot - Slot de guardado
   * @returns {Promise<Object>} Datos del guardado
   */
  loadSlot: (userId, slot) =>
    api.get(`/player/saves/${userId}/${slot}`).then((res) => res.data),

  /**
   * Alias para compatibilidad con código viejo (getUserSaves).
   */
  getUserSaves(userId) {
    return this.getSaves(userId);
  },
};

export default api;
