// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ==================== INCUBATIONS ====================

export const incubationAPI = {
  getAll: () => api.get('/incubations'),
  getOne: (id) => api.get(`/incubations/${id}`),
  create: (data) => api.post('/incubations', data),
  update: (id, data) => api.put(`/incubations/${id}`, data),
  delete: (id) => api.delete(`/incubations/${id}`),
  getStats: (id) => api.get(`/incubations/${id}/stats`),
};

// ==================== SENSORS ====================

export const sensorAPI = {
  getLatest: (incubationId) => api.get(`/sensors/${incubationId}/latest`),
  getHistory: (incubationId, hours = 24) => 
    api.get(`/sensors/${incubationId}/history?hours=${hours}`),
};

// ==================== ACTUATORS ====================

export const actuatorAPI = {
  getState: (incubationId) => api.get(`/actuators/${incubationId}`),
  update: (incubationId, data) => api.put(`/actuators/${incubationId}`, data),
  turnEggs: (incubationId) => api.post(`/actuators/${incubationId}/turn`),
};

// ==================== ALERTS ====================

export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: (incubationId) => api.put('/alerts/read-all', { incubationId }),
};

export default api;