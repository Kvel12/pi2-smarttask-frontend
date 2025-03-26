import axios from 'axios';

// Usar el proxy serverless con comodín para cualquier ruta
const API_BASE = '/api';

// Configurar axios para incluir el token en todas las solicitudes
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funciones para autenticación
export const login = (credentials) => axios.post(`${API_BASE}/auth/login`, credentials);
export const register = (userData) => axios.post(`${API_BASE}/auth/register`, userData);
export const logout = () => axios.post(`${API_BASE}/auth/logout`);

// Funciones para proyectos
export const fetchProjects = () => axios.get(`${API_BASE}/projects`);
export const createProject = (project) => axios.post(`${API_BASE}/projects`, project);
export const deleteProject = (projectId) => axios.delete(`${API_BASE}/projects/${projectId}`);
export const fetchProjectById = (projectId) => axios.get(`${API_BASE}/projects/${projectId}`);
export const updateProject = (projectId, project) => axios.put(`${API_BASE}/projects/${projectId}`, project);
export const fetchAllProjectIds = () => axios.get(`${API_BASE}/projects/all-ids`);

// Funciones para tareas
export const fetchTasks = (projectId) => axios.get(`${API_BASE}/tasks/project/${projectId}`);
export const createTask = (task) => axios.post(`${API_BASE}/tasks`, task);
export const deleteTask = (taskId) => axios.delete(`${API_BASE}/tasks/${taskId}`);
export const fetchTaskById = (taskId) => axios.get(`${API_BASE}/tasks/${taskId}`);
export const updateTask = (taskId, task) => axios.put(`${API_BASE}/tasks/${taskId}`, task);
export const fetchTasksByProjectId = (projectId) => axios.get(`${API_BASE}/tasks/project/${projectId}`);