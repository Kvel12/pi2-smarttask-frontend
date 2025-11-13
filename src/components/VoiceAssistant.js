import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop, FaRobot, FaTimes, FaSpinner, FaArrowUp, FaWindowMinimize } from 'react-icons/fa';
import VoiceRecorder from './VoiceRecorder';
import { processVoiceCommand, fetchProjects, fetchTasksByProjectId, processVoiceText } from '../api';
import { useApp } from '../App';

const VoiceAssistant = ({ onCreateTask }) => {
  const { refreshProjects } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [errorTooltip, setErrorTooltip] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadProjects();
    }
  }, [isOpen, isMinimized]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetchProjects();
      setProjects(response.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading projects:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const showErrorTooltip = (message) => {
    setErrorTooltip(message);
    setTimeout(() => {
      setErrorTooltip(null);
    }, 2000);
  };

  const toggleAssistant = () => {
    if (isOpen && !isMinimized) {
      // Si está abierto y no minimizado, cerrar completamente (reiniciar contexto)
      setIsOpen(false);
      setMessages([]);
      setInputMessage('');
    } else if (isOpen && isMinimized) {
      // Si está minimizado, restaurar
      setIsMinimized(false);
    } else {
      // Si está cerrado, abrir con mensaje de bienvenida
      setIsOpen(true);
      setIsMinimized(false);
      setMessages([
        { 
          role: 'assistant', 
          content: 'Hello! I\'m your SmartTask virtual assistant. You can ask me about your projects and tasks, or create new ones using your voice. How can I help you today?' 
        }
      ]);
    }
  };

  const minimizeAssistant = () => {
    setIsMinimized(true);
  };

  const handleTranscriptionComplete = async (text) => {
  if (!text || text.trim() === '') {
    setMessages(prevMessages => [
      ...prevMessages, 
      { 
        role: 'assistant', 
        content: 'I couldn\'t understand the audio. Please try again speaking more clearly.' 
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
      content: 'Processing your request...',
      isTemporary: true
    }
  ]);
  
  try {
    console.log("📡 Sending transcription to backend:", text);
    
    // ✅ PRIMERO: Obtener la transcripción y el idioma detectado
    // Ya viene del handleTranscriptionComplete del VoiceRecorder
    // Si necesitas detectar el idioma aquí, puedes hacerlo:
    const detectedLanguage = text.toLowerCase().includes('create') || 
                            text.toLowerCase().includes('task') || 
                            text.toLowerCase().includes('project') ? 'en' : 'es';
    
    // ✅ SEGUNDO: Procesar con el idioma detectado
    const response = await processVoiceText(text, detectedLanguage, 'assistance');
    console.log("✅ Response received:", response.data);
    
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
          content: response.data.message || response.data.response || 'Sorry, I couldn\'t process your request.' 
        }
      ]);
    }
  } catch (error) {
    console.error('❌ Error processing transcription:', error);
    
    setMessages(prevMessages => 
      prevMessages.filter(msg => !msg.isTemporary || msg.id !== processingMessageId)
    );
    
    setMessages(prevMessages => [
      ...prevMessages, 
      { 
        role: 'assistant', 
        content: `Sorry, an error occurred: ${error.response?.data?.error || error.message}. Please try again.` 
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
            content: data.message || `Task created: "${data.taskDetails?.title || 'New task'}"` 
          }
        ]);
        
        console.log('🔄 Refreshing projects automatically...');
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
            content: data.message || `Project created: "${data.projectDetails?.title || 'New project'}"` 
          }
        ]);
        
        console.log('🔄 Refreshing projects automatically...');
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
            content: data.message || data.error || 'An error occurred while processing your request.' 
          }
        ]);
        break;
        
      default:
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: 'assistant', 
            content: data.message || data.response || 'I\'ve processed your request.' 
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
            ? `I found ${results.length} task(s) matching your search.`
            : 'I didn\'t find any tasks matching your search.',
          searchResults: results 
        }
      ]);
    } catch (error) {
      console.error('Error searching tasks:', error);
      showErrorTooltip('Error searching tasks');
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: 'Sorry, an error occurred while searching for tasks.' 
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

  const handleKeyPress = (e) => {
    // Enviar con Enter, nueva línea con Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div>
      {/* Botón flotante */}
      <button 
        className="assistant-toggle-button"
        onClick={toggleAssistant}
        style={styles.toggleButton}
        title={isMinimized ? "Restore Assistant" : "Open Assistant"}
      >
        <FaRobot style={{ fontSize: '24px' }} />
        {messages.length > 1 && isMinimized && (
          <span style={styles.badge}>{messages.length - 1}</span>
        )}
      </button>
      
      {/* Ventana del asistente */}
      {isOpen && !isMinimized && (
        <div className="assistant-window" style={styles.assistantWindow}>
          {/* Header */}
          <div className="assistant-header" style={styles.assistantHeader}>
            <div style={styles.assistantTitle}>
              <FaRobot style={{ marginRight: '8px' }} />
              SmartTask Assistant
            </div>
            <div style={styles.headerButtons}>
              <button 
                className="minimize-button"
                onClick={minimizeAssistant}
                style={styles.headerButton}
                title="Minimize (preserve context)"
              >
                <FaWindowMinimize />
              </button>
              <button 
                className="close-button"
                onClick={toggleAssistant}
                style={styles.headerButton}
                title="Close (clear conversation)"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          {/* Mensajes */}
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
                    <h4>Search Results:</h4>
                    <ul style={styles.resultsList}>
                      {message.searchResults.map((task, taskIndex) => (
                        <li key={taskIndex} style={styles.resultItem}>
                          <div style={styles.resultTitle}>{task.title}</div>
                          <div style={styles.resultDetails}>
                            <span>Status: {task.status === 'pending' ? 'Pending' :
                                          task.status === 'in_progress' ? 'In Progress' :
                                          task.status === 'completed' ? 'Completed' : 'Cancelled'}</span>
                            {task.projectName && (
                              <span>Project: {task.projectName}</span>
                            )}
                            {(task.dueDate || task.completion_date) && (
                              <span>Due Date: {new Date(task.dueDate || task.completion_date).toLocaleDateString()}</span>
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
          
          {/* Input Container */}
          <div className="input-container" style={styles.inputContainer}>
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message or use the microphone... (Enter to send, Shift+Enter for new line)"
              style={styles.textareaField}
              rows={1}
            />
            
            <div style={styles.buttonsContainer}>
              <button 
                className="send-button"
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === ''}
                style={{
                  ...styles.sendButton,
                  opacity: inputMessage.trim() === '' ? 0.5 : 1
                }}
                title="Send message"
              >
                <FaArrowUp />
              </button>
              
              <div style={styles.recorderContainer}>
                <VoiceRecorder 
                  onTranscriptionComplete={handleTranscriptionComplete}
                  onError={showErrorTooltip}
                />
              </div>
            </div>
          </div>
          
          {/* Loading Indicator */}
          {isWaitingForResponse && (
            <div style={styles.loadingIndicator}>
              <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          
          {/* Error Tooltip */}
          {errorTooltip && (
            <div style={styles.errorTooltip}>
              {errorTooltip}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

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
    zIndex: 1000,
    transition: 'all 0.3s ease',
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff4444',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '2px solid white',
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
    zIndex: 1000,
    animation: 'slideIn 0.3s ease',
  },
  assistantHeader: {
    padding: '15px',
    backgroundColor: '#512da8',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assistantTitle: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
  },
  headerButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
    borderRadius: '18px 18px 0 18px',
    padding: '10px 15px',
    maxWidth: '80%',
    wordWrap: 'break-word',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderRadius: '18px 18px 18px 0',
    padding: '10px 15px',
    maxWidth: '80%',
    wordWrap: 'break-word',
  },
  messageContent: {
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    borderTop: '1px solid #eee',
    gap: '8px',
  },
  textareaField: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    outline: 'none',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  buttonsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
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
    border: 'none',
    transition: 'opacity 0.2s',
  },
  recorderContainer: {
    display: 'flex',
    alignItems: 'center',
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
    alignItems: 'center',
    zIndex: 10,
  },
  errorTooltip: {
    position: 'absolute',
    bottom: '80px',
    right: '20px',
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    fontSize: '14px',
    maxWidth: '300px',
    zIndex: 1001,
    animation: 'slideIn 0.3s ease, fadeOut 0.3s ease 1.7s',
  },
  searchResults: {
    marginTop: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
  },
  resultsList: {
    listStyle: 'none',
    padding: '0',
    margin: '5px 0 0 0',
  },
  resultItem: {
    padding: '8px',
    borderBottom: '1px solid #eee',
    marginBottom: '5px',
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: '3px',
  },
  resultDetails: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    color: '#666',
  },
};

export default VoiceAssistant;