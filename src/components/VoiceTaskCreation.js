import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaPlus } from 'react-icons/fa';
import VoiceRecorder from './VoiceRecorder';
import { processVoiceCommand, createTask, fetchProjects } from '../api';
import Swal from 'sweetalert2';

const VoiceTaskCreation = ({ onTaskCreated, selectedProjectId = null }) => {
  const [transcription, setTranscription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(selectedProjectId);

  // Cargar la lista de proyectos para mostrar en el select
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetchProjects();
        setProjects(response.data || []);
        
        // Si no hay un proyecto seleccionado y hay proyectos disponibles, seleccionar el primero
        if (!selectedProject && response.data && response.data.length > 0) {
          setSelectedProject(response.data[0].id);
        }
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los proyectos'
        });
      }
    };
    
    if (formVisible) {
      loadProjects();
    }
  }, [formVisible, selectedProject]);

  // Si se proporciona un selectedProjectId como prop, actualizarlo
  useEffect(() => {
    if (selectedProjectId) {
      setSelectedProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleTranscriptionComplete = async (text) => {
    if (!selectedProject) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debes seleccionar un proyecto antes de crear una tarea por voz'
      });
      return;
    }
    
    setTranscription(text);
    setProcessing(true);
    
    try {
      // Enviar la transcripción para ser procesada
      const response = await processVoiceCommand(text, 'createTask', selectedProject);
      
      if (response.data && response.data.success) {
        // Mapear los datos para que coincidan con lo que espera el backend
        setTaskDetails({
          title: response.data.taskDetails?.title || '',
          description: response.data.taskDetails?.description || '',
          status: response.data.taskDetails?.status || 'pending',
          completion_date: response.data.taskDetails?.completion_date || '',
          projectId: selectedProject
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data?.error || 'No se pudo procesar el comando de voz'
        });
      }
    } catch (error) {
      console.error('Error al procesar la transcripción:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al procesar la transcripción'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskDetails || !taskDetails.title) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El título de la tarea es obligatorio'
      });
      return;
    }
    
    if (!selectedProject) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debes seleccionar un proyecto para la tarea'
      });
      return;
    }
    
    try {
      setProcessing(true);
      
      // Crear la tarea en la base de datos
      const formattedTask = {
        title: taskDetails.title,
        description: taskDetails.description,
        status: taskDetails.status || 'pending',
        completion_date: taskDetails.completion_date,
        projectId: selectedProject,
        // Agregar fecha de creación
        creation_date: new Date().toISOString()
      };
      
      const response = await createTask(formattedTask);
      
      Swal.fire({
        icon: 'success',
        title: '¡Tarea creada!',
        text: `La tarea "${taskDetails.title}" ha sido creada exitosamente`
      });
      
      // Resetear el formulario
      setTranscription('');
      setTaskDetails(null);
      setFormVisible(false);
      
      // Notificar al componente padre
      if (onTaskCreated) {
        onTaskCreated(response.data);
      }
    } catch (error) {
      console.error('Error al crear la tarea:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo crear la tarea'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Encontrar nombre del proyecto seleccionado
  const getSelectedProjectName = () => {
    const project = projects.find(p => p.id === selectedProject);
    return project ? project.title : 'No seleccionado';
  };

  return (
    <div style={styles.container}>
      <button 
        style={styles.toggleButton}
        onClick={() => setFormVisible(!formVisible)}
      >
        {formVisible 
          ? "Cancelar creación por voz" 
          : <><FaMicrophone style={styles.buttonIcon} /> Crear tarea por voz</>
        }
      </button>
      
      {formVisible && (
        <div style={styles.formContainer}>
          <h3 style={styles.title}>Crear tarea por voz</h3>
          
          <div style={styles.projectSelection}>
            <label style={styles.projectLabel}>Seleccionar proyecto:</label>
            <select 
              style={styles.projectSelect}
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              disabled={processing}
            >
              <option value="">Selecciona un proyecto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          
          <p style={styles.instructions}>
            Presiona el botón del micrófono y describe la tarea que deseas crear.
            <br />
            <small>Ejemplo: "Crear una tarea llamada Implementar login con estado pendiente para el 10 de noviembre"</small>
          </p>
          
          <div style={styles.recorderContainer}>
            <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
          </div>
          
          {transcription && (
            <div style={styles.transcriptionBox}>
              <h4 style={styles.subtitle}>Transcripción:</h4>
              <p style={styles.transcriptionText}>{transcription}</p>
            </div>
          )}
          
          {processing && (
            <div style={styles.loadingMessage}>Procesando comando de voz...</div>
          )}
          
          {taskDetails && (
            <div style={styles.detailsBox}>
              <h4 style={styles.subtitle}>Detalles de la tarea:</h4>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Título:</span>
                <span style={styles.detailValue}>{taskDetails.title}</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Descripción:</span>
                <span style={styles.detailValue}>
                  {taskDetails.description || 'No especificada'}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Fecha límite:</span>
                <span style={styles.detailValue}>
                  {taskDetails.completion_date || 'No especificada'}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Estado:</span>
                <span style={styles.detailValue}>
                  {taskDetails.status === 'pending' ? 'Pendiente' :
                   taskDetails.status === 'in_progress' ? 'En progreso' :
                   taskDetails.status === 'completed' ? 'Completada' : 'Cancelada'}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Proyecto:</span>
                <span style={styles.detailValue}>{getSelectedProjectName()}</span>
              </div>
              
              <div style={styles.actionButtons}>
                <button 
                  style={styles.createButton}
                  onClick={handleCreateTask}
                  disabled={processing}
                >
                  <FaPlus style={styles.buttonIcon} /> Crear tarea
                </button>
                <button 
                  style={styles.cancelButton}
                  onClick={() => {
                    setTranscription('');
                    setTaskDetails(null);
                  }}
                  disabled={processing}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '20px',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#512da8',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  buttonIcon: {
    marginRight: '8px',
  },
  formContainer: {
    marginTop: '15px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#512da8',
  },
  projectSelection: {
    marginBottom: '15px',
  },
  projectLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  projectSelect: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    fontSize: '14px',
  },
  instructions: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '14px',
  },
  recorderContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  transcriptionBox: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  subtitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#512da8',
  },
  transcriptionText: {
    margin: 0,
    color: '#333',
  },
  loadingMessage: {
    textAlign: 'center',
    color: '#666',
    margin: '15px 0',
    fontStyle: 'italic',
  },
  detailsBox: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  detailRow: {
    display: 'flex',
    margin: '10px 0',
  },
  detailLabel: {
    fontWeight: 'bold',
    width: '100px',
    color: '#555',
  },
  detailValue: {
    flex: 1,
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  createButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '48%',
  },
};

export default VoiceTaskCreation;