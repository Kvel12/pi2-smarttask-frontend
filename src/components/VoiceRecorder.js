import React, { useState, useRef } from 'react';
import { FaMicrophone, FaStop, FaSpinner } from 'react-icons/fa';
import { convertSpeechToText } from '../api';

const VoiceRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Iniciar grabación
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    
    try {
      console.log("🎤 Solicitando acceso al micrófono...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("✅ Acceso al micrófono concedido");
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log("🛑 Grabación detenida, procesando audio...");
        setIsProcessing(true);
        
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error("No se capturaron datos de audio");
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm;codecs=opus' 
          });
          
          console.log(`📦 Audio blob creado: ${audioBlob.size} bytes`);
          
          // Enviar al BACKEND para transcripción
          console.log("📡 Enviando audio al backend...");
          const response = await convertSpeechToText(audioBlob);
          const transcription = response.data.transcription;
          
          console.log(`✅ Transcripción recibida: "${transcription}"`);
          
          if (transcription && onTranscriptionComplete) {
            onTranscriptionComplete(transcription);
          } else {
            throw new Error("No se recibió transcripción del backend");
          }
          
        } catch (err) {
          console.error('❌ Error al procesar audio:', err);
          setError(err.response?.data?.error || err.message || 'Error al procesar el audio');
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          
          // Liberar el micrófono
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      console.log("▶️ Grabación iniciada");
    } catch (err) {
      console.error('❌ Error al iniciar grabación:', err);
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
      setIsRecording(false);
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log("⏸️ Solicitando detener grabación...");
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
  };

  // Toggle grabación
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