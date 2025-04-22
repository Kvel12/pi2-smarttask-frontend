import React, { useState, useRef } from 'react';
import { FaMicrophone, FaStop, FaSpinner } from 'react-icons/fa';
import googleSpeechService from '../services/googleSpeechService';
import { processVoiceText } from '../api';

const VoiceRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = []; // Limpiar chunks existentes
    
    try {
      console.log("Solicitando acceso al micrófono...");
      // Solicitar acceso al micrófono con configuración optimizada para Speech-to-Text
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono para mejor compatibilidad con Google STT
          sampleRate: 16000, // 16 kHz es la frecuencia recomendada por Google
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("Acceso al micrófono concedido, configurando MediaRecorder...");
      
      // Crear MediaRecorder con configuración óptima
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });
      
      // Usar manejadores de eventos directos que modifican la ref (no el estado)
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Chunk de audio agregado: ${event.data.size} bytes, total chunks: ${audioChunksRef.current.length}`);
        }
      });
      
      recorder.addEventListener('stop', async () => {
        console.log(`Grabación detenida, procesando ${audioChunksRef.current.length} chunks de audio`);
        setIsProcessing(true);
        
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error("No se capturaron datos de audio");
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm;codecs=opus' 
          });
          
          console.log(`Blob de audio creado: ${audioBlob.size} bytes`);
          
          // Intentar usar Google Speech-to-Text directamente
          try {
            console.log("Enviando audio a Google Speech-to-Text...");
            const transcription = await googleSpeechService.transcribeAudio(audioBlob);
            console.log(`Transcripción recibida: "${transcription}"`);
            
            if (transcription && onTranscriptionComplete) {
              onTranscriptionComplete(transcription);
            } else {
              throw new Error("No se recibió transcripción");
            }
          } catch (googleError) {
            console.error("Error con Google Speech-to-Text:", googleError);
            
            // Intentar con Web Speech API como fallback
            console.log("Intentando con Web Speech API...");
            try {
              const webTranscription = await useWebSpeechAPI();
              if (webTranscription && onTranscriptionComplete) {
                console.log(`Transcripción de Web Speech API: "${webTranscription}"`);
                onTranscriptionComplete(webTranscription);
              } else {
                throw new Error("No se pudo transcribir con Web Speech API");
              }
            } catch (webSpeechError) {
              console.error("Error con Web Speech API:", webSpeechError);
              throw new Error(`No se pudo transcribir el audio: ${googleError.message}`);
            }
          }
        } catch (err) {
          console.error('Error al procesar el audio:', err);
          setError(`Error al procesar el audio: ${err.message}`);
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          
          // Liberar el micrófono
          if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
          
          mediaRecorderRef.current = null;
        }
      });
      
      // Iniciar con timeslice para asegurar que dataavailable se dispare frecuentemente
      console.log("Iniciando grabación...");
      recorder.start(1000); // Disparar dataavailable cada 1 segundo
      mediaRecorderRef.current = recorder;
      
      console.log("Grabación iniciada correctamente");
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar la grabación:', err);
      setError(`No se pudo acceder al micrófono: ${err.message}. Verifica los permisos.`);
      setIsRecording(false);
    }
  };

  // Función para usar Web Speech API como fallback
  const useWebSpeechAPI = () => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error("Tu navegador no soporta reconocimiento de voz"));
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Web Speech API transcripción: " + transcript);
        resolve(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error("Error en Web Speech API:", event.error);
        reject(new Error(`Error en reconocimiento: ${event.error}`));
      };
      
      recognition.onend = () => {
        console.log("Web Speech API finalizado");
      };
      
      // Iniciar reconocimiento
      recognition.start();
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log("Solicitando datos finales antes de detener grabación");
      // Asegurar que obtenemos cualquier dato restante
      mediaRecorderRef.current.requestData();
      // Luego detener la grabación
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <div style={styles.voiceRecorder}>
      <button 
        style={isRecording ? {...styles.recordButton, ...styles.recordingButton} : styles.recordButton}
        onClick={toggleRecording}
        disabled={isProcessing}
        title={isRecording ? "Detener grabación" : "Iniciar grabación"}
      >
        {isRecording ? <FaStop /> : <FaMicrophone />}
      </button>
      
      {isProcessing && (
        <div style={styles.processingIndicator}>
          <FaSpinner style={styles.spinner} /> 
          <span>Procesando audio...</span>
        </div>
      )}
      
      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  voiceRecorder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '10px 0',
  },
  recordButton: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    background: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    fontSize: '20px',
    color: '#512da8',
  },
  recordingButton: {
    background: '#ff4c4c',
    color: 'white',
    animation: 'pulse 1.5s infinite',
  },
  processingIndicator: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '10px',
    fontSize: '14px',
    color: '#666',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  errorMessage: {
    marginTop: '10px',
    color: '#ff4c4c',
    fontSize: '14px',
    textAlign: 'center',
    maxWidth: '300px',
  },
};

export default VoiceRecorder;