import React, { useState, useEffect } from 'react';
import { deleteProject, createProject, updateProject, fetchTasksByProjectId } from '../api';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import { FaPlus, FaEye, FaEdit, FaTrash, FaCalendarAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';
import ProjectForm from './ProjectForm';
import Modal from './Modal';
import Swal from 'sweetalert2';
import taskImage from '../assets/tarea.png'; // Asegúrate de que la ruta sea correcta

const ProjectList = ({ projects, onSelectProject, onDeleteProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectList, setProjectList] = useState(projects);
  const [editProject, setEditProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setProjectList(projects);
  }, [projects]);

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
          onDeleteProject();
        } catch (error) {
          console.error('Error deleting project:', error);
          Swal.fire('Error', 'There was a problem deleting the project.', 'error');
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
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Something went wrong!', 'error');
    }
  };

  const handleViewTasks = async (project) => {
    setSelectedProject(project);
    try {
      const response = await fetchTasksByProjectId(project.id);
      setTasks(response.data);
      return TaskList(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Swal.fire('Error', 'There was a problem fetching tasks for this project.', 'error');
    }
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
    <div>
      <nav style={styles.navbar}>
        <h1 style={styles.title}>SmartTask Project Manager</h1>
        <button style={styles.newProjectButton} onClick={handleNewProjectClick}>
          NEW PROJECT <FaPlus style={styles.icon} />
        </button>
      </nav>
      
      {projectList.length === 0 ? (
        <div style={styles.noProjectsMessage}>
          <img src={taskImage} alt="No projects" style={styles.noProjectsImage} />
          <p>No projects available. Create a new project to get started!</p>
        </div>
      ) : (
        <ul style={styles.projectList}>
          {projectList.map((project) => (
            <li key={project.id} style={styles.projectItem}>
              <div style={styles.projectDetails}>
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

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ProjectForm
          onSubmit={handleSubmit}
          onClose={closeModal}
          initialData={editProject}
        />
      </Modal>
    </div>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#512da8',
    color: '#fff',
  },
  title: {
    margin: 0,
    fontSize: '24px',
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
  },
  icon: {
    marginLeft: '10px',
  },
  projectList: {
    listStyle: 'none',
    padding: 0,
  },
  projectItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    borderBottom: '1px solid #ccc',
  },
  projectDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  projectTitle: {
    fontWeight: 'bold',
    fontSize: '20px',
    marginBottom: '5px',
  },
  projectInfo: {
    marginBottom: '5px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    color: '#888',
    marginBottom: '5px',
  },
  actions: {
    display: 'flex',
  },
  viewButton: {
    marginRight: '10px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  editButton: {
    marginRight: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  noProjectsMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    textAlign: 'center',
  },
  noProjectsImage: {
    width: '100px',
    height: '100px',
    marginBottom: '20px',
  },
};

export default ProjectList;