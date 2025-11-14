import axios from "axios";
import { storage } from "./storage";

// Instancia base de Axios
const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

// Interceptor para incluir el token JWT en cada request
api.interceptors.request.use((config) => {
  const user = storage.getUser();
  const token = user?.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('📤 Token enviado en request:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No se encontró token para la request');
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Token expirado o inválido');
      storage.clear();
      // Opcional: redirigir al login
      // window.location.reload();
    }
    return Promise.reject(error);
  }
);

// --- Rutas de autenticación ---
export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),
};

// --- Rutas relacionadas al progreso del jugador ---
export const playerApi = {
  saveProgress: (saveData) =>
    api.post("/player/save", saveData).then((res) => res.data),

  getSaves: (userId) =>
    api.get(`/player/saves/${userId}`).then((res) => res.data),

  loadSlot: (userId, slot) =>
    api.get(`/player/saves/${userId}/${slot}`).then((res) => res.data),

  getUserSaves(userId) {
    return this.getSaves(userId);
  },
};

export default api;