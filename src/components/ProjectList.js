import React, { useState, useEffect } from 'react';
import { deleteProject, createProject, updateProject, fetchTasksByProjectId, logout, fetchProjects } from '../api';
import { useHistory } from 'react-router-dom';
import TaskList from './TaskList';
import TaskModal from './TaskModal';
import { FaPlus, FaEye, FaEdit, FaTrash, FaCalendarAlt, FaClock, FaExclamationCircle, FaSignOutAlt, FaChartBar, FaList, FaTasks, FaMicrophone } from 'react-icons/fa';
import ProjectForm from './ProjectForm';
import Modal from './Modal';
import Swal from 'sweetalert2';
import taskImage from '../assets/tarea.png'; // Asegúrate de que la ruta sea correcta
import Chart from 'react-apexcharts';
import VoiceProjectCreation from './VoiceProjectCreation'; // Importamos el componente de creación de proyectos por voz
import VoiceTaskCreation from './VoiceTaskCreation'; // Importamos el componente de creación de tareas por voz
import VoiceAssistant from './VoiceAssistant'; // Importamos el asistente virtual por voz

const Dashboard = ({ projects }) => {
  // No mostrar dashboard si no hay proyectos
  if (!projects || projects.length === 0) {
    return (
      <div style={styles.noProjectsMessage}>
        <img src={taskImage} alt="No projects" style={styles.noProjectsImage} />
        <p>No projects available. Create a new project to see analytics!</p>
      </div>
    );
  }

  // Prepare data for the "Projects Created by Date" chart
  const projectsByDate = projects.reduce((acc, project) => {
    const dateStr = project.creation_date || project.createdAt;
    if (!dateStr) return acc;
    
    // Convertir a formato de fecha legible
    const date = new Date(dateStr);
    if (isNaN(date)) return acc;
    
    const formattedDate = date.toLocaleDateString();
    acc[formattedDate] = (acc[formattedDate] || 0) + 1;
    return acc;
  }, {});

  // Ordenar fechas cronológicamente
  const sortedDates = Object.keys(projectsByDate).sort((a, b) => new Date(a) - new Date(b));
  const projectsCount = sortedDates.map(date => projectsByDate[date]);

  const projectsByDateOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Roboto, sans-serif',
      toolbar: {
        show: false
      },
      background: '#f8f9fa',
      borderRadius: 10,
    },
    dataLabels: {
      enabled: true,
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
      }
    },
    colors: ['#512da8'],
    xaxis: {
      categories: sortedDates,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    title: {
      text: 'Projects Created by Date',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#512da8'
      }
    },
    grid: {
      borderColor: '#ececec',
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} project(s)`
      }
    }
  };

  const projectsByDateSeries = [
    {
      name: 'Projects',
      data: projectsCount,
    },
  ];

  // Prepare data for the "Projects by Priority" chart
  const projectsByPriority = projects.reduce((acc, project) => {
    const priority = project.priority || 'unknown';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const priorities = Object.keys(projectsByPriority);
  const priorityCounts = Object.values(projectsByPriority);

  // Colores personalizados para prioridades
  const priorityColors = {
    'high': '#dc3545',
    'medium': '#ffc107',
    'low': '#28a745',
    'unknown': '#6c757d'
  };

  // Crear array de colores basado en prioridades
  const colors = priorities.map(priority => priorityColors[priority] || '#6c757d');

  const projectsByPriorityOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Roboto, sans-serif',
      background: '#f8f9fa',
      borderRadius: 10,
    },
    labels: priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    colors: colors,
    title: {
      text: 'Projects by Priority',
      align: 'center',
      style: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#512da8'
      }
    },
    legend: {
      position: 'bottom'
    },
    dataLabels: {
      formatter: (val, opts) => {
        return `${Math.round(val)}% (${priorityCounts[opts.seriesIndex]})`;
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  // Generar stats para el resumen
  const totalProjects = projects.length;
  const highPriorityProjects = projectsByPriority['high'] || 0;
  
  // Calcular proyectos próximos a vencer (en los próximos 7 días)
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  
  const upcomingDeadlines = projects.filter(project => {
    if (!project.culmination_date) return false;
    const deadline = new Date(project.culmination_date);
    return deadline >= now && deadline <= nextWeek;
  }).length;

  return (
    <div style={styles.dashboard}>
      {/* Stats Summary */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaTasks size={24} />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{totalProjects}</h3>
            <p style={styles.statLabel}>Total Projects</p>
          </div>
        </div>
        
        <div style={{...styles.statCard, background: 'linear-gradient(to right, #ff9966, #ff5e62)'}}>
          <div style={styles.statIcon}>
            <FaExclamationCircle size={24} />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{highPriorityProjects}</h3>
            <p style={styles.statLabel}>High Priority Projects</p>
          </div>
        </div>
        
        <div style={{...styles.statCard, background: 'linear-gradient(to right, #56ab2f, #a8e063)'}}>
          <div style={styles.statIcon}>
            <FaCalendarAlt size={24} />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statValue}>{upcomingDeadlines}</h3>
            <p style={styles.statLabel}>Upcoming Deadlines</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={styles.chartContainer}>
        <div style={styles.chart}>
          <Chart
            options={projectsByDateOptions}
            series={projectsByDateSeries}
            type="bar"
            height={380}
          />
        </div>
        <div style={styles.chart}>
          <Chart
            options={projectsByPriorityOptions}
            series={priorityCounts}
            type="pie"
            height={380}
          />
        </div>
      </div>
    </div>
  );
};

const ProjectList = ({ projects: initialProjects, onSelectProject, onDeleteProject }) => {
  const history = useHistory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectList, setProjectList] = useState(initialProjects || []);
  const [editProject, setEditProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' o 'projects'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Función para recargar proyectos si fuera necesario
  const refreshProjects = async () => {
    try {
      const response = await fetchProjects();
      setProjectList(response.data || []);
    } catch (error) {
      console.error('Error refreshing projects:', error);
      if (error.response && error.response.status === 401) {
        // Token expirado o inválido
        redirectToRoot();
      }
    }
  };

  // Actualizar proyectos cuando cambie el refreshTrigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshProjects();
    }
  }, [refreshTrigger]);

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
          if (onDeleteProject) onDeleteProject();
          setRefreshTrigger(prev => prev + 1);
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
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Something went wrong!', 'error');
      if (error.response && error.response.status === 401) {
        redirectToRoot();
      }
    }
  };

  // Corregido para asegurar que la pestaña de proyectos esté activa antes de mostrar el modal
  const handleViewTasks = (project) => {
    // Primero, aseguramos que la pestaña 'projects' esté activa
    setActiveTab('projects');
    
    // Establecemos el proyecto seleccionado
    setSelectedProject(project);
    
    // Usamos un pequeño retraso para asegurar que el cambio de pestaña se haya procesado
    setTimeout(() => {
      setIsTaskModalOpen(true);
      
      if (onSelectProject) {
        onSelectProject(project);
      }
    }, 50); // Un retraso mínimo para asegurar el orden de ejecución
  };
  
  // Función de logout mejorada
  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 1. Intentar llamar a API logout
          try {
            await logout();
          } catch (error) {
            console.warn("Logout API call failed, proceeding with local logout", error);
          }
          
          // 2. Limpiar todos los tokens posibles
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          
          // 3. Mostrar mensaje de éxito
          Swal.fire({
            title: 'Logged Out!', 
            text: 'You have been successfully logged out.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            // 4. Redireccionar a la raíz
            redirectToRoot();
          });
        } catch (error) {
          console.error('Error during logout process:', error);
          
          // Asegurar limpieza de tokens incluso con error
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          
          // Mostrar mensaje y redireccionar
          Swal.fire({
            title: 'Logged Out!', 
            text: 'You have been logged out.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            redirectToRoot();
          });
        }
      }
    });
  };

  const handleTasksUpdate = () => {
    // Actualizar la lista de proyectos si es necesario
    setRefreshTrigger(prev => prev + 1);
  };

  // Manejador para cuando se crea un proyecto por voz
  const handleVoiceProjectCreated = (newProject) => {
    setProjectList(prev => [...prev, newProject]);
    setRefreshTrigger(prev => prev + 1);
  };

  // Manejador para cuando se crea una tarea por voz
  const handleVoiceTaskCreated = () => {
    setRefreshTrigger(prev => prev + 1);
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

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <h1 style={styles.title}>SmartTask Project Manager</h1>
        <div style={styles.navButtons}>
          <button style={styles.newProjectButton} onClick={handleNewProjectClick}>
            NEW PROJECT <FaPlus style={styles.icon} />
          </button>
          <button style={styles.logoutButton} onClick={handleLogout}>
            LOGOUT <FaSignOutAlt style={styles.icon} />
          </button>
        </div>
      </nav>
      
      {/* Tabs Navigation */}
      <div style={styles.tabs}>
        <button 
          style={activeTab === 'dashboard' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaChartBar style={styles.tabIcon} /> Dashboard
        </button>
        <button 
          style={activeTab === 'projects' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => setActiveTab('projects')}
        >
          <FaList style={styles.tabIcon} /> Projects
        </button>
      </div>
      
      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard projects={projectList} />
        )}
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
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
          </>
        )}
      </div>

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

      {/* Asistente Virtual */}
      <VoiceAssistant onCreateTask={handleVoiceTaskCreated} />
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#512da8',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  navButtons: {
    display: 'flex',
    gap: '10px',
  },
  newProjectButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#512da8',
    color: '#fff',
    border: '1px solid #fff',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#dc3545',
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
  tabs: {
    display: 'flex',
    backgroundColor: '#fff',
    padding: '0 20px',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    margin: '0 10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#666',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    borderBottom: '3px solid #512da8',
    color: '#512da8',
  },
  tabIcon: {
    marginRight: '8px',
  },
  tabContent: {
    padding: '20px',
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
  dashboard: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  statCard: {
    flex: '1 1 250px',
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    borderRadius: '10px',
    background: 'linear-gradient(to right, #4b6cb7, #182848)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  statIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '50%',
    padding: '15px',
    marginRight: '15px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    margin: '0 0 5px 0',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: '20px',
    gap: '20px',
  },
  chart: {
    flex: '1 1 45%',
    minWidth: '300px',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    background: '#fff',
  }
};

export default ProjectList;