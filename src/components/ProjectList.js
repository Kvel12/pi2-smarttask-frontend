import React, { useState, useEffect } from 'react';
import { deleteProject, createProject, updateProject, fetchTasksByProjectId, logout } from '../api';
import { useHistory } from 'react-router-dom';
import TaskModal from './TaskModal';
import { FaPlus, FaEye, FaEdit, FaTrash, FaCalendarAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';
import ProjectForm from './ProjectForm';
import Modal from './Modal';
import Swal from 'sweetalert2';
import taskImage from '../assets/tarea.png'; // Asegúrate de que la ruta sea correcta
import VoiceProjectCreation from './VoiceProjectCreation'; // Componente de creación de proyectos por voz
import VoiceTaskCreation from './VoiceTaskCreation'; // Componente de creación de tareas por voz
// Eliminar la importación de VoiceAssistant ya que ahora está en Layout

const ProjectList = ({ projects: initialProjects, onProjectUpdate }) => {
  const history = useHistory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectList, setProjectList] = useState(initialProjects || []);
  const [editProject, setEditProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null);

  // Función simplificada para redireccionar a la raíz/dominio principal
  const redirectToRoot = () => {
    try {
      // Redirigir directamente a la raíz del dominio
      const baseUrl = window.location.origin;
      
      // Limpiar el historial para prevenir navegación "atrás"
      window.history.replaceState(null, document.title, baseUrl);
      
      // Forzar una recarga completa
      window.location.href = baseUrl;
    } catch (error) {
      console.error("Error during redirect:", error);
      // Si todo falla, recarga la página en la ubicación actual
      window.location.reload();
    }
  };

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      // Si no hay token, redirige a la raíz
      redirectToRoot();
    }
  }, []);

  useEffect(() => {
    if (initialProjects) {
      setProjectList(initialProjects);
    }
  }, [initialProjects]);

  const handleDelete = async (projectId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this project!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteProject(projectId);
          const updatedProjects = projectList.filter(project => project.id !== projectId);
          setProjectList(updatedProjects);
          Swal.fire('Deleted!', 'Your project has been deleted.', 'success');
          if (onProjectUpdate) onProjectUpdate();
        } catch (error) {
          console.error('Error deleting project:', error);
          Swal.fire('Error', 'There was a problem deleting the project.', 'error');
          if (error.response && error.response.status === 401) {
            redirectToRoot();
          }
        }
      }
    });
  };

  const handleNewProjectClick = () => {
    setIsModalOpen(true);
    setEditProject(null);
  };

  const handleEditProject = (project) => {
    setEditProject({
      ...project,
      culmination_date: project.culmination_date ? project.culmination_date.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditProject(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editProject) {
        const response = await updateProject(editProject.id, formData);
        const updatedProject = response.data;
        const updatedProjects = projectList.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        );
        setProjectList(updatedProjects);
        Swal.fire('Updated!', 'Your project has been updated.', 'success');
      } else {
        const now = new Date();
        const response = await createProject({
          ...formData,
          created_at: now.toISOString(),
        });
        const newProject = response.data;
        setProjectList([...projectList, newProject]);
        Swal.fire('Created!', 'Your new project has been created.', 'success');
      }
      closeModal();
      if (onProjectUpdate) onProjectUpdate();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Something went wrong!', 'error');
      if (error.response && error.response.status === 401) {
        redirectToRoot();
      }
    }
  };

  const handleViewTasks = (project) => {
    setSelectedProject(project);
    setIsTaskModalOpen(true);
  };
  
  const handleTasksUpdate = () => {
    // Actualizar la lista de proyectos si es necesario
    if (onProjectUpdate) onProjectUpdate();
  };

  // Manejador para cuando se crea un proyecto por voz
  const handleVoiceProjectCreated = (newProject) => {
    setProjectList(prev => [...prev, newProject]);
    if (onProjectUpdate) onProjectUpdate();
  };

  // Manejador para cuando se crea una tarea por voz
  const handleVoiceTaskCreated = () => {
    if (onProjectUpdate) onProjectUpdate();
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'low':
        return { backgroundColor: 'rgba(40, 167, 69, 0.2)', padding: '3px 6px', borderRadius: '4px' };
      case 'medium':
        return { backgroundColor: 'rgba(255, 193, 7, 0.2)', padding: '3px 6px', borderRadius: '4px' };
      case 'high':
        return { backgroundColor: 'rgba(220, 53, 69, 0.2)', padding: '3px 6px', borderRadius: '4px' };
      default:
        return {};
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : 'Invalid Date';
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorMessage}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={() => {
              setError(null);
              if (onProjectUpdate) onProjectUpdate();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Botón para crear nuevo proyecto */}
      <div style={styles.headerSection}>
        <button style={styles.newProjectButton} onClick={handleNewProjectClick}>
          NEW PROJECT <FaPlus style={styles.icon} />
        </button>
      </div>
      
      {/* Componentes de voz */}
      <div style={styles.voiceComponentsContainer}>
        <VoiceProjectCreation onProjectCreated={handleVoiceProjectCreated} />
        
        {/* Si hay un proyecto seleccionado, mostrar el componente de creación de tareas con ese proyecto */}
        {selectedProject ? (
          <VoiceTaskCreation 
            onTaskCreated={handleVoiceTaskCreated} 
            selectedProjectId={selectedProject.id} 
          />
        ) : (
          <VoiceTaskCreation 
            onTaskCreated={handleVoiceTaskCreated} 
          />
        )}
      </div>
        
      {/* Lista de proyectos */}
      {!projectList || projectList.length === 0 ? (
        <div style={styles.noProjectsMessage}>
          <img src={taskImage} alt="No projects" style={styles.noProjectsImage} />
          <p>No projects available. Create a new project to get started!</p>
        </div>
      ) : (
        <ul style={styles.projectList}>
          {projectList.map((project) => (
            <li key={project.id} style={styles.projectItem}>
              <div style={styles.projectDetails}>
                <div style={styles.projectHeader}>
                  <span style={styles.projectTitle}>{project.title}</span>
                  <div style={styles.projectInfo}>
                    <div style={styles.infoItem}>
                      <FaCalendarAlt /> <strong>Created:</strong> {' '}
                      {formatDate(project.creation_date || project.createdAt)}
                    </div>
                    <div style={styles.infoItem}>
                      <FaClock /> <strong>Culmination:</strong> {' '}
                      {formatDate(project.culmination_date)}
                    </div>
                    <div style={styles.infoItem}>
                      <FaExclamationCircle /> <strong>Priority:</strong> {' '}
                      <span style={getPriorityStyle(project.priority)}>{project.priority}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.actions}>
                  <button style={styles.viewButton} onClick={() => handleViewTasks(project)}>
                    <FaEye /> View Tasks
                  </button>
                  <button style={styles.editButton} onClick={() => handleEditProject(project)}>
                    <FaEdit /> Edit
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(project.id)}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Project Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ProjectForm
          onSubmit={handleSubmit}
          onClose={closeModal}
          initialData={editProject}
        />
      </Modal>

      {/* Task Modal */}
      {selectedProject && (
        <TaskModal 
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
          projectId={selectedProject.id}
          onCreateTask={handleTasksUpdate}
          onUpdateTask={handleTasksUpdate}
          onDeleteTask={handleTasksUpdate}
        />
      )}

      {/* Eliminamos la línea del VoiceAssistant ya que ahora está en el Layout */}
    </div>
  );
};

const styles = {
  headerSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  newProjectButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#512da8',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  icon: {
    marginLeft: '10px',
  },
  voiceComponentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  projectList: {
    listStyle: 'none',
    padding: 0,
  },
  projectItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '15px',
    margin: '10px 0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  projectDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectHeader: {
    flex: 1,
  },
  projectTitle: {
    display: 'block',
    fontWeight: 'bold',
    fontSize: '20px',
    marginBottom: '10px',
    color: '#512da8',
  },
  projectInfo: {
    marginBottom: '5px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    color: '#666',
    marginBottom: '5px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  noProjectsMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  noProjectsImage: {
    width: '100px',
    height: '100px',
    marginBottom: '20px',
    opacity: '0.7',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  errorMessage: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '500px',
  },
  retryButton: {
    backgroundColor: '#512da8',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    marginTop: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }
};

export default ProjectList;