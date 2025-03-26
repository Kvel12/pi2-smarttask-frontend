const axios = require('axios');

export default async function handler(req, res) {
  // Configurar CORS para la función serverless
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-auth-token');

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
    // Añadir el token de autorización si existe
    const headers = {};
    if (req.headers['x-auth-token']) {
      headers['x-auth-token'] = req.headers['x-auth-token'];
    }

    // Reenviar la solicitud al backend
    const response = await axios({
      method: req.method,
      url: `https://smarttask-backend-tcsj.onrender.com/api/${endpoint}`,
      data: req.body,
      headers
    });

    // Devolver la respuesta al cliente
    return res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: 'Error del servidor' };
    return res.status(status).json(data);
  }
}