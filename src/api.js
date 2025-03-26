import axios from 'axios';

// URL relativa, esto funcionará cuando el frontend y backend estén en el mismo dominio
const API_URL = '/api';

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
export const login = (credentials) => axios.post(`${API_URL}/auth/login`, credentials);
export const register = (userData) => axios.post(`${API_URL}/auth/register`, userData);
export const logout = () => axios.post(`${API_URL}/auth/logout`);

// Funciones para proyectos
export const fetchProjects = () => axios.get(`${API_URL}/projects`);
export const createProject = (project) => axios.post(`${API_URL}/projects`, project);
export const deleteProject = (projectId) => axios.delete(`${API_URL}/projects/${projectId}`);
export const fetchProjectById = (projectId) => axios.get(`${API_URL}/projects/${projectId}`);
export const updateProject = (projectId, project) => axios.put(`${API_URL}/projects/${projectId}`, project);
export const fetchAllProjectIds = () => axios.get(`${API_URL}/projects/all-ids`);

// Funciones para tareas
export const fetchTasks = (projectId) => axios.get(`${API_URL}/tasks/project/${projectId}`);
export const createTask = (task) => axios.post(`${API_URL}/tasks`, task);
export const deleteTask = (taskId) => axios.delete(`${API_URL}/tasks/${taskId}`);
export const fetchTaskById = (taskId) => axios.get(`${API_URL}/tasks/${taskId}`);
export const updateTask = (taskId, task) => axios.put(`${API_URL}/tasks/${taskId}`, task);
export const fetchTasksByProjectId = (projectId) => axios.get(`${API_URL}/tasks/project/${projectId}`);