import axios from 'axios';

const API_URL = 'https://smarttask-backend-tcsj.onrender.com';

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

// Funciones para proyectos
export const fetchProjects = () => axios.get(`${API_URL}/api/projects`);
export const createProject = (project) => axios.post(`${API_URL}/api/projects`, project);
export const deleteProject = (projectId) => axios.delete(`${API_URL}/api/projects/${projectId}`);
export const fetchProjectById = (projectId) => axios.get(`${API_URL}/api/projects/${projectId}`);
export const updateProject = (projectId, project) => axios.put(`${API_URL}/api/projects/${projectId}`, project);
export const fetchAllProjectIds = () => axios.get(`${API_URL}/api/projects/all-ids`);

// Funciones para tareas
export const fetchTasks = (projectId) => axios.get(`${API_URL}/api/tasks/project/${projectId}`);
export const createTask = (task) => axios.post(`${API_URL}/api/tasks`, task);
export const deleteTask = (taskId) => axios.delete(`${API_URL}/api/tasks/${taskId}`);
export const fetchTaskById = (taskId) => axios.get(`${API_URL}/api/tasks/${taskId}`);
export const updateTask = (taskId, task) => axios.put(`${API_URL}/api/tasks/${taskId}`, task);
export const fetchTasksByProjectId = (projectId) => axios.get(`${API_URL}/api/tasks/project/${projectId}`);

// Funciones para autenticación
export const login = (credentials) => axios.post(`${API_URL}/api/auth/login`, credentials);
export const register = (userData) => axios.post(`${API_URL}/api/auth/register`, userData);
export const logout = () => axios.post(`${API_URL}/api/auth/logout`);