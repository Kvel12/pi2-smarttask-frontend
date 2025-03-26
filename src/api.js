import axios from 'axios';

// AllOrigins es un servicio de proxy CORS de confianza y gratuito
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const BACKEND_URL = 'https://smarttask-backend-tcsj.onrender.com/api';

// Configuración especial para este proxy
const api = axios.create({
  baseURL: BACKEND_URL,
  transformRequest: [(data, headers) => {
    // No hay transformación especial para los datos
    return data;
  }]
});

// Configurar axios para incluir el token en todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    // Modificar la URL para usar el proxy
    config.url = CORS_PROXY + encodeURIComponent(BACKEND_URL + config.url);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funciones para autenticación
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const logout = () => api.post('/auth/logout');

// Funciones para proyectos
export const fetchProjects = () => api.get('/projects');
export const createProject = (project) => api.post('/projects', project);
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);
export const fetchProjectById = (projectId) => api.get(`/projects/${projectId}`);
export const updateProject = (projectId, project) => api.put(`/projects/${projectId}`, project);
export const fetchAllProjectIds = () => api.get('/projects/all-ids');

// Funciones para tareas
export const fetchTasks = (projectId) => api.get(`/tasks/project/${projectId}`);
export const createTask = (task) => api.post('/tasks', task);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const fetchTaskById = (taskId) => api.get(`/tasks/${taskId}`);
export const updateTask = (taskId, task) => api.put(`/tasks/${taskId}`, task);
export const fetchTasksByProjectId = (projectId) => api.get(`/tasks/project/${projectId}`);