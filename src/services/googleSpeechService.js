// Servicio para comunicarse directamente con Google Speech-to-Text desde el frontend
class GoogleSpeechService {
    constructor() {
      // Obtener las credenciales de las variables de entorno
      this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      this.baseUrl = 'https://speech.googleapis.com/v1/speech:recognize';
    }
  
    // Método para transcribir audio usando la API de Google
    async transcribeAudio(audioBlob) {
      try {
        // Convertir el blob de audio a base64
        const base64Audio = await this._blobToBase64(audioBlob);
        
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
  
        // Realizar la solicitud a la API de Google
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error de Google Speech-to-Text: ${errorData.error?.message || 'Error desconocido'}`);
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