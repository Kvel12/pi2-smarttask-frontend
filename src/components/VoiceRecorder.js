import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaStop, FaSpinner } from 'react-icons/fa';
import { convertSpeechToText } from '../api';

const VoiceRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Configurar el grabador de audio cuando el componente se monte o cambie el estado de grabación
  useEffect(() => {
    if (isRecording && !mediaRecorder) {
      startRecording();
    }
    
    return () => {
      if (mediaRecorder) {
        mediaRecorder.removeEventListener('dataavailable', handleDataAvailable);
        mediaRecorder.removeEventListener('stop', handleStop);
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    try {
      // Configuración específica para obtener una grabación de audio de alta calidad
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono para mejor compatibilidad con Speech-to-Text
          sampleRate: 16000, // 16 kHz es la frecuencia recomendada por Google
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Configurar el Media Recorder para grabación optimizada para Speech-to-Text
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus', // Formato que funciona bien con Google Speech-to-Text
        audioBitsPerSecond: 16000 // 16 kHz
      });
      
      // Configurar los manejadores de eventos
      recorder.addEventListener('dataavailable', handleDataAvailable);
      recorder.addEventListener('stop', handleStop);
      
      // Comenzar a grabar
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks([]);
    } catch (err) {
      console.error('Error al iniciar la grabación:', err);
      setError('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
      setIsRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      setAudioChunks(prevChunks => [...prevChunks, event.data]);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    
    try {
      // Crear un blob con todos los chunks de audio
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      
      // Enviar al backend para procesamiento con Google Speech-to-Text
      const response = await convertSpeechToText(audioBlob);
      
      // Manejar la respuesta
      if (response.data && response.data.transcription) {
        if (onTranscriptionComplete) {
          onTranscriptionComplete(response.data.transcription);
        }
      } else {
        setError('No se pudo procesar el audio.');
      }
    } catch (err) {
      console.error('Error al procesar el audio:', err);
      setError('Error al procesar el audio. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
      setMediaRecorder(null);
      
      // Detener todas las pistas de audio para liberar el micrófono
      if (mediaRecorder && mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else if (mediaRecorder) {
      setIsRecording(false);
      mediaRecorder.stop();
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
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
};

export default VoiceRecorder;