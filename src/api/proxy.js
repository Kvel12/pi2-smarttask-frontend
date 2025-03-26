// api/proxy.js
import axios from 'axios';

// Helper para leer el cuerpo de la solicitud
const readBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve({});
      }
    });
  });
};

export default async function handler(req, res) {
  // Configurar CORS para la función serverless
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-auth-token, Authorization');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { endpoint } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Se requiere un endpoint' });
  }

  try {
    // Leer el cuerpo de la solicitud
    const requestBody = await readBody(req);
    
    // Preparar headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Añadir el token de autorización si existe
    if (req.headers['x-auth-token']) {
      headers['x-auth-token'] = req.headers['x-auth-token'];
    }

    // Reenviar la solicitud al backend
    const url = `https://smarttask-backend-tcsj.onrender.com/api/${endpoint}`;
    console.log(`Proxy: ${req.method} ${url}`);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: requestBody,
      headers: headers
    });

    // Devolver la respuesta al cliente
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: 'Error del servidor: ' + error.message };
    return res.status(status).json(data);
  }
}