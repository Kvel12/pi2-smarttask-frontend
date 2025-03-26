const axios = require('axios');

module.exports = async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-auth-token, Authorization');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Obtener la ruta desde los parámetros
  const { path } = req.query;
  if (!path || !path.length) {
    return res.status(400).json({ error: 'Path is required' });
  }

  const endpoint = path.join('/');
  
  try {
    // Preparar headers para la solicitud al backend
    const headers = {};
    
    // Transferir headers relevantes
    if (req.headers['x-auth-token']) {
      headers['x-auth-token'] = req.headers['x-auth-token'];
    }
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }

    // Construir URL del backend
    const backendUrl = `https://smarttask-backend-tcsj.onrender.com/api/${endpoint}`;
    
    // Ejecutar la solicitud al backend
    const response = await axios({
      method: req.method,
      url: backendUrl,
      data: req.body,
      headers: headers
    });

    // Devolver la respuesta del backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // Manejar la respuesta de error
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data || { message: 'Internal Server Error: ' + error.message };
    
    return res.status(status).json(errorMessage);
  }
};