import { JWT } from 'google-auth-library';

class GoogleSpeechService {
  constructor() {
    // Parseamos las credenciales de la variable de entorno
    try {
      this.credentials = JSON.parse(process.env.REACT_APP_GOOGLE_CREDENTIALS);
      console.log("Credenciales cargadas correctamente");
    } catch (error) {
      console.error("Error al parsear las credenciales:", error);
      this.credentials = null;
    }
    
    this.baseUrl = 'https://speech.googleapis.com/v1/speech:recognize';
    this.authToken = null;
    this.tokenExpiry = null;
  }

  // Método para obtener un token de autenticación
  async getAuthToken() {
    // Si ya tenemos un token válido, lo devolvemos
    if (this.authToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      console.log("Usando token de autenticación existente");
      return this.authToken;
    }

    try {
      if (!this.credentials) {
        throw new Error("No hay credenciales disponibles");
      }

      // Creamos un cliente JWT con las credenciales
      const client = new JWT({
        email: this.credentials.client_email,
        key: this.credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      // Obtenemos el token
      const token = await client.authorize();
      this.authToken = token.access_token;
      // Establecemos la expiración (5 minutos antes de la expiración real para estar seguros)
      this.tokenExpiry = Date.now() + (token.expires_in - 300) * 1000;
      
      console.log("Nuevo token de autenticación obtenido");
      return this.authToken;
    } catch (error) {
      console.error("Error al obtener el token de autenticación:", error);
      throw error;
    }
  }

  // Método para transcribir audio usando la API de Google
  async transcribeAudio(audioBlob) {
    try {
      // Convertir el blob de audio a base64
      const base64Audio = await this._blobToBase64(audioBlob);
      
      // Obtener el token de autenticación
      const token = await this.getAuthToken();
      
      // Configurar la solicitud a la API de Google
      const requestData = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 16000,
          languageCode: 'es-ES',
          alternativeLanguageCodes: ['es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-US'],
          enableAutomaticPunctuation: true,
          model: 'default',
        },
        audio: {
          content: base64Audio
        }
      };

      console.log("Enviando solicitud a Google Speech-to-Text...");
      
      // Realizar la solicitud a la API de Google con el token de autenticación
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta de Google:", errorData);
        throw new Error(`Error de Google Speech-to-Text: ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Respuesta de Google Speech-to-Text:', data);

      // Extraer la transcripción
      if (data.results && data.results.length > 0) {
        return data.results[0].alternatives[0].transcript;
      }
      
      return '';
    } catch (error) {
      console.error('Error al transcribir audio con Google:', error);
      throw error;
    }
  }

  // Método privado para convertir un blob a base64
  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extraer la parte de base64 del resultado (eliminar el prefijo de data URL)
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default new GoogleSpeechService();