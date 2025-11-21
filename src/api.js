import axios from 'axios';

// Detectar automáticamente el entorno y la URL correcta
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('✅ Detectado localhost, usando backend local');
    return 'http://localhost:5500/api';
  }

  console.log('✅ Detectado producción, usando backend de Render');
  return 'https://smarttask-backend-tcsj.onrender.com/api';
};

const API_URL = getApiUrl();

if (process.env.REACT_APP_ENVIRONMENT === 'development' || process.env.REACT_APP_DEBUG === 'true') {
  console.log('🔗 API URL configurada:', API_URL);
  console.log('🌍 Entorno:', process.env.REACT_APP_ENVIRONMENT || 'default');
  console.log('📍 Hostname:', window.location.hostname);
}

axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    if (process.env.REACT_APP_ENVIRONMENT === 'development') {
      console.log('📡 Request a:', config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
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
export const fetchProjectMembers = (projectId) => axios.get(`${API_URL}/projects/${projectId}/members`);
export const fetchProjectStatuses = (projectId) => axios.get(`${API_URL}/projects/${projectId}/statuses`);

// Funciones para tareas
export const fetchTasks = (projectId) => axios.get(`${API_URL}/tasks/project/${projectId}`);
export const createTask = (task) => axios.post(`${API_URL}/tasks`, task);
export const deleteTask = (taskId) => axios.delete(`${API_URL}/tasks/${taskId}`);
export const fetchTaskById = (taskId) => axios.get(`${API_URL}/tasks/${taskId}`);
export const updateTask = (taskId, task) => axios.put(`${API_URL}/tasks/${taskId}`, task);
export const fetchTasksByProjectId = (projectId) => axios.get(`${API_URL}/tasks/project/${projectId}`);

// ✅ FUNCIONES MEJORADAS PARA SPEECH-TO-TEXT
export const convertSpeechToText = (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  return axios.post(`${API_URL}/speech/speech-to-text`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000
  });
};

// ✅ MEJORADO: Ahora incluye detectedLanguage
export const processVoiceText = (transcription, detectedLanguage = null, commandType = null, projectId = null) => {
  return axios.post(`${API_URL}/speech/process-voice-text`, {
    transcription,
    detectedLanguage,  // ✅ NUEVO: Pasar el idioma detectado
    commandType,
    projectId
  });
};

export const processVoiceCommand = (transcription, commandType = null, projectId = null) => {
  return axios.post(`${API_URL}/speech/process-voice-command`, {
    transcription,
    commandType,
    projectId
  });
};

export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`, {
      timeout: 5000
    });
    console.log('✅ API disponible:', response.data);
    return { available: true, data: response.data };
  } catch (error) {
    console.error('❌ API no disponible:', error.message);
    return { available: false, error: error.message };
  }
};

export default axios;