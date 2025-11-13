import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { fetchTasksByProjectId } from '../api';
import KanbanBoard from './KanbanBoard';
import taskImage from '../assets/tarea.png';
import Swal from 'sweetalert2';

const KanbanPage = () => {
  const { projects, refreshProjects } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Seleccionar el primer proyecto por defecto
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Cargar tareas cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadTasks = async (projectId) => {
    setIsLoading(true);
    try {
      const response = await fetchTasksByProjectId(projectId);
      setTasks(response.data || []);
      console.log(`✅ Loaded ${response.data.length} tasks for project ${projectId}`);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not load tasks. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = parseInt(e.target.value);
    setSelectedProjectId(projectId);
  };

  // Si no hay proyectos
  if (!projects || projects.length === 0) {
    return (
      <div style={styles.emptyState}>
        <img src={taskImage} alt="No projects" style={styles.emptyImage} />
        <h2 style={styles.emptyTitle}>No Projects Available</h2>
        <p style={styles.emptyText}>
          Create a project first to start organizing your tasks in the Kanban board.
        </p>
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={styles.container}>
      {/* Header con selector de proyecto */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>📊 Kanban Board</h2>
          <p style={styles.subtitle}>Drag and drop tasks to update their status</p>
        </div>
        
        <div style={styles.headerRight}>
          <label style={styles.label} htmlFor="project-select">
            Select Project:
          </label>
          <select
            id="project-select"
            style={styles.select}
            value={selectedProjectId || ''}
            onChange={handleProjectChange}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Información del proyecto seleccionado */}
      {selectedProject && (
        <div style={styles.projectInfo}>
          <div style={styles.projectDetails}>
            <h3 style={styles.projectTitle}>{selectedProject.title}</h3>
            {selectedProject.description && (
              <p style={styles.projectDescription}>{selectedProject.description}</p>
            )}
          </div>
          <div style={styles.projectStats}>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Priority:</span>
              <span style={{
                ...styles.statValue,
                ...styles[`priority${selectedProject.priority}`]
              }}>
                {selectedProject.priority ? selectedProject.priority.toUpperCase() : 'N/A'}
              </span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Total Tasks:</span>
              <span style={styles.statValue}>{tasks.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tablero Kanban */}
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <KanbanBoard projectId={selectedProjectId} tasks={tasks} />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  headerLeft: {
    flex: '1 1 auto',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  select: {
    padding: '10px 15px',
    fontSize: '14px',
    border: '2px solid #512da8',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    minWidth: '200px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  projectInfo: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  projectDetails: {
    flex: '1 1 60%',
  },
  projectTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#512da8',
  },
  projectDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  projectStats: {
    display: 'flex',
    gap: '30px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '5px',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  priorityhigh: {
    color: '#dc3545',
  },
  prioritymedium: {
    color: '#ffc107',
  },
  prioritylow: {
    color: '#28a745',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #512da8',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  emptyImage: {
    width: '120px',
    height: '120px',
    marginBottom: '20px',
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    maxWidth: '400px',
  }
};

export default KanbanPage;