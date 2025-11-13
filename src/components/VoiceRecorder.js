import React, { useState, useRef } from 'react';
import { FaMicrophone, FaStop, FaSpinner } from 'react-icons/fa';
import { convertSpeechToText } from '../api';

const VoiceRecorder = ({ onTranscriptionComplete, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          // ❌ NO especificar sampleRate - el navegador usa 48kHz por defecto
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log("✅ Microphone access granted");
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`📦 Audio chunk: ${event.data.size} bytes`);
        }
      };
      
      recorder.onstop = async () => {
        console.log("🛑 Recording stopped, processing audio...");
        setIsProcessing(true);
        
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error("No audio data captured");
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm;codecs=opus' 
          });
          
          console.log(`📦 Audio blob created: ${audioBlob.size} bytes`);
          
          console.log("📡 Sending audio to backend...");
          const response = await convertSpeechToText(audioBlob);
          const transcription = response.data.transcription;
          
          console.log(`✅ Transcription received: "${transcription}"`);
          
          if (transcription && onTranscriptionComplete) {
            onTranscriptionComplete(transcription);
          } else {
            throw new Error("No transcription received from backend");
          }
          
        } catch (err) {
          console.error('❌ Error processing audio:', err);
          const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Error processing audio';
          console.error('Full error:', err.response?.data);
          if (onError) {
            onError(errorMessage);
          }
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
          
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      console.log("▶️ Recording started");
    } catch (err) {
      console.error('❌ Error starting recording:', err);
      const errorMessage = 'Could not access microphone. Please check permissions.';
      if (onError) {
        onError(errorMessage);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log("⏸️ Requesting to stop recording...");
      mediaRecorderRef.current.requestData();
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
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isProcessing ? <FaSpinner style={styles.spinner} /> : (isRecording ? <FaStop /> : <FaMicrophone />)}
      </button>
      
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
    alignItems: 'center',
  },
  recordButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    fontSize: '18px',
    color: '#512da8',
  },
  recordingButton: {
    background: '#ff4c4c',
    color: 'white',
    animation: 'pulse 1.5s infinite',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

export default VoiceRecorder;