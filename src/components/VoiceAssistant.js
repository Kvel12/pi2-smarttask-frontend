import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop, FaRobot, FaTimes, FaSpinner, FaArrowUp } from 'react-icons/fa';
import VoiceRecorder from './VoiceRecorder';
import { processVoiceCommand, fetchProjects, fetchTasksByProjectId, processVoiceText } from '../api';
import { useApp } from '../App'; // Importar el contexto

const VoiceAssistant = ({ onCreateTask }) => {
  const { refreshProjects } = useApp(); // Obtener función de refresh
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar proyectos al abrir
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetchProjects();
      setProjects(response.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setMessages([
        { 
          role: 'assistant', 
          content: 'Hola, soy tu asistente virtual de SmartTask. Puedes pedirme información sobre tus proyectos y tareas o crear nuevas tareas usando tu voz. ¿En qué puedo ayudarte hoy?' 
        }
      ]);
    }
  };

  const handleTranscriptionComplete = async (text) => {
    if (!text || text.trim() === '') {
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: 'No pude entender el audio. Por favor, intenta de nuevo hablando más claramente.' 
        }
      ]);
      return;
    }
    
    const userMessage = { role: 'user', content: text };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsWaitingForResponse(true);
    
    const processingMessageId = Date.now().toString();
    setMessages(prevMessages => [
      ...prevMessages, 
      { 
        id: processingMessageId,
        role: 'assistant', 
        content: 'Procesando tu solicitud...',
        isTemporary: true
      }
    ]);
    
    try {
      console.log("📡 Enviando transcripción al backend:", text);
      const response = await processVoiceText(text, 'assistance');
      console.log("✅ Respuesta recibida:", response.data);
      
      setMessages(prevMessages => 
        prevMessages.filter(msg => !msg.isTemporary || msg.id !== processingMessageId)
      );
      
      if (response.data && response.data.action) {
        handleActionResponse(response.data);
      } else {
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: response.data.message || response.data.response || 'Lo siento, no pude procesar tu solicitud.' 
          }
        ]);
      }
    } catch (error) {
      console.error('❌ Error al procesar transcripción:', error);
      
      setMessages(prevMessages => 
        prevMessages.filter(msg => !msg.isTemporary || msg.id !== processingMessageId)
      );
      
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: `Lo siento, ocurrió un error: ${error.response?.data?.error || error.message}. Por favor, inténtalo de nuevo.` 
        }
      ]);
    } finally {
      setIsWaitingForResponse(false);
    }
  };
  
  const handleActionResponse = (data) => {
    switch (data.action) {
      case 'createTask':
      case 'task_created':
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: data.message || `Tarea creada: "${data.taskDetails?.title || 'Nueva tarea'}"` 
          }
        ]);
        
        // 🔥 ACTUALIZAR PROYECTOS AUTOMÁTICAMENTE
        console.log('🔄 Actualizando proyectos automáticamente...');
        setTimeout(() => {
          refreshProjects();
        }, 500);
        break;
        
      case 'createProject':
      case 'project_created':
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: data.message || `Proyecto creado: "${data.projectDetails?.title || 'Nuevo proyecto'}"` 
          }
        ]);
        
        // 🔥 ACTUALIZAR PROYECTOS AUTOMÁTICAMENTE
        console.log('🔄 Actualizando proyectos automáticamente...');
        setTimeout(() => {
          refreshProjects();
        }, 500);
        break;
        
      case 'searchTasks':
        handleSearchResults(data.searchResults || [], data.searchParams);
        break;
        
      case 'error':
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: data.message || data.error || 'Ocurrió un error al procesar tu solicitud.' 
          }
        ]);
        break;
        
      default:
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: data.message || data.response || 'He procesado tu solicitud.' 
          }
        ]);
    }
  };

  const handleSearchResults = async (searchResults, searchParams) => {
    try {
      let results = searchResults;
      
      if ((!results || results.length === 0) && searchParams) {
        if (searchParams.projectId) {
          const response = await fetchTasksByProjectId(searchParams.projectId);
          results = filterTasks(response.data || [], searchParams);
        } else {
          const allTasks = [];
          
          for (const project of projects) {
            const response = await fetchTasksByProjectId(project.id);
            if (response.data && response.data.length > 0) {
              const tasksWithProject = response.data.map(task => ({
                ...task,
                projectName: project.title
              }));
              allTasks.push(...tasksWithProject);
            }
          }
          
          results = filterTasks(allTasks, searchParams);
        }
      }
      
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: results.length > 0 
            ? `Encontré ${results.length} tareas que coinciden con tu búsqueda.`
            : 'No encontré tareas que coincidan con tu búsqueda.',
          searchResults: results 
        }
      ]);
    } catch (error) {
      console.error('Error al buscar tareas:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: 'Lo siento, ocurrió un error al buscar las tareas.' 
        }
      ]);
    }
  };

  const filterTasks = (tasks, searchParams) => {
    if (!searchParams) return tasks;
    
    return tasks.filter(task => {
      if (searchParams.searchTerm && 
          !task.title?.toLowerCase().includes(searchParams.searchTerm.toLowerCase()) &&
          !task.description?.toLowerCase().includes(searchParams.searchTerm.toLowerCase())) {
        return false;
      }
      
      if (searchParams.status && task.status !== searchParams.status) {
        return false;
      }
      
      if (searchParams.dateRange) {
        const taskDate = new Date(task.dueDate || task.completion_date);
        
        if (searchParams.dateRange.from) {
          const fromDate = new Date(searchParams.dateRange.from);
          if (taskDate < fromDate) return false;
        }
        
        if (searchParams.dateRange.to) {
          const toDate = new Date(searchParams.dateRange.to);
          if (taskDate > toDate) return false;
        }
      }
      
      return true;
    });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    handleTranscriptionComplete(inputMessage);
    setInputMessage('');
  };

  return (
    <div>
      <button 
        className="assistant-toggle-button"
        onClick={toggleAssistant}
        style={styles.toggleButton}
      >
        <FaRobot style={{ fontSize: '24px' }} />
      </button>
      
      {isOpen && (
        <div className="assistant-window" style={styles.assistantWindow}>
          <div className="assistant-header" style={styles.assistantHeader}>
            <div style={styles.assistantTitle}>
              <FaRobot style={{ marginRight: '8px' }} />
              Asistente SmartTask
            </div>
            <button 
              className="close-button"
              onClick={toggleAssistant}
              style={styles.closeButton}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="messages-container" style={styles.messagesContainer}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role}`}
                style={message.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                <div style={styles.messageContent}>{message.content}</div>
                
                {message.searchResults && message.searchResults.length > 0 && (
                  <div style={styles.searchResults}>
                    <h4>Resultados de la búsqueda:</h4>
                    <ul style={styles.resultsList}>
                      {message.searchResults.map((task, taskIndex) => (
                        <li key={taskIndex} style={styles.resultItem}>
                          <div style={styles.resultTitle}>{task.title}</div>
                          <div style={styles.resultDetails}>
                            <span>Estado: {task.status === 'pending' ? 'Pendiente' :
                                          task.status === 'in_progress' ? 'En progreso' :
                                          task.status === 'completed' ? 'Completada' : 'Cancelada'}</span>
                            {task.projectName && (
                              <span>Proyecto: {task.projectName}</span>
                            )}
                            {(task.dueDate || task.completion_date) && (
                              <span>Fecha límite: {new Date(task.dueDate || task.completion_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="input-container" style={styles.inputContainer}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe un mensaje o usa el micrófono..."
              style={styles.inputField}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === ''}
              style={styles.sendButton}
            >
              <FaArrowUp />
            </button>
            
            <div style={styles.recorderContainer}>
              <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            </div>
          </div>
          
          {isWaitingForResponse && (
            <div style={styles.loadingIndicator}>
              <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ... (estilos iguales)

const styles = {
  toggleButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#512da8',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    border: 'none',
    zIndex: 1000
  },
  assistantWindow: {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '350px',
    height: '500px',
    borderRadius: '10px',
    backgroundColor: '#fff',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000
  },
  assistantHeader: {
    padding: '15px',
    backgroundColor: '#512da8',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  assistantTitle: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '18px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
    borderRadius: '18px 18px 0 18px',
    padding: '10px 15px',
    maxWidth: '80%'
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderRadius: '18px 18px 18px 0',
    padding: '10px 15px',
    maxWidth: '80%'
  },
  messageContent: {
    wordBreak: 'break-word'
  },
  inputContainer: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #eee',
    alignItems: 'center',
    gap: '8px'
  },
  inputField: {
    flex: 1,
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    outline: 'none',
    fontSize: '14px'
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#512da8',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    border: 'none'
  },
  recorderContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchResults: {
    marginTop: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px'
  },
  resultsList: {
    listStyle: 'none',
    padding: '0',
    margin: '5px 0 0 0'
  },
  resultItem: {
    padding: '8px',
    borderBottom: '1px solid #eee',
    marginBottom: '5px'
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: '3px'
  },
  resultDetails: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    color: '#666'
  }
};

export default VoiceAssistant;