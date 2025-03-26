import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import Modal from './Modal2';
import { fetchTasksByProjectId, createTask, deleteTask, updateTask } from '../api';
import taskImage from '../assets/tarea.png';

const TaskModal = ({ isOpen, onClose, projectId, onCreateTask, onUpdateTask, onDeleteTask }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setIsLoading(true);
      console.log(`Fetching tasks for project ID: ${projectId}`);
      
      fetchTasksByProjectId(projectId)
        .then(response => {
          console.log("Tasks fetched successfully:", response.data);
          setTasks(response.data || []);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching tasks:', error);
          setIsLoading(false);
          Swal.fire('Error', 'There was a problem fetching the tasks.', 'error');
        });
    }
  }, [isOpen, projectId]);

  const handleCreateTask = async (taskData) => {
    try {
      // Mapear los campos correctamente según lo que espera el backend
      const currentDate = new Date().toISOString();
      
      const formattedData = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'pending',
        creation_date: currentDate,        // Campo requerido por el backend
        completion_date: taskData.dueDate, // El backend espera completion_date, no dueDate
        projectId: projectId               // Usar projectId, no project_id
      };

      console.log('Sending task data to server:', formattedData);
      
      const response = await createTask(formattedData);
      console.log('Task created successfully:', response.data);
      
      const createdTask = response.data;
      setTasks(prevTasks => [...prevTasks, createdTask]);
      
      if (onCreateTask) {
        onCreateTask();
      }
      
      Swal.fire('Created!', 'The task has been created successfully.', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Información detallada del error para depuración
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        console.error('Error headers:', error.response.headers);
      }
      
      // Mensaje de error más descriptivo
      let errorMessage = 'There was a problem creating the task.';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMessage = `Validation error: ${error.response.data.errors[0].msg}`;
        }
      }
      
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      // Mismo mapeo para actualización
      const formattedData = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'pending',
        completion_date: taskData.dueDate,  // Mapear dueDate a completion_date
        projectId: projectId
      };

      // Solo incluir creation_date si se está actualizando
      if (taskData.creation_date) {
        formattedData.creation_date = taskData.creation_date;
      }

      console.log('Updating task with data:', formattedData);
      
      const response = await updateTask(taskData.id, formattedData);
      const updatedTaskFromServer = response.data;
      
      const updatedTasks = tasks.map(task =>
        task.id === updatedTaskFromServer.id ? updatedTaskFromServer : task
      );
      
      setTasks(updatedTasks);
      
      if (onUpdateTask) {
        onUpdateTask();
      }
      
      setSelectedTask(null);
      Swal.fire('Updated!', 'The task has been updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Información detallada del error para depuración
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      
      // Mensaje de error más descriptivo
      let errorMessage = 'There was a problem updating the task.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTask(taskId);
          const updatedTasks = tasks.filter(task => task.id !== taskId);
          setTasks(updatedTasks);
          
          if (onDeleteTask) {
            onDeleteTask();
          }
          
          Swal.fire(
            'Deleted!',
            'The task has been deleted.',
            'success'
          );
        } catch (error) {
          console.error('Error deleting task:', error);
          
          // Mensaje de error más descriptivo
          let errorMessage = 'There was a problem deleting the task.';
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          
          Swal.fire('Error', errorMessage, 'error');
        }
      }
    });
  };

  const handleEditTask = (task) => {
    // Cuando editamos, debemos mapear los campos del backend al formato del formulario
    const taskForForm = {
      ...task,
      dueDate: task.completion_date // Mapear completion_date a dueDate para el formulario
    };
    setSelectedTask(taskForForm);
  };

  const handleCancelEdit = () => {
    setSelectedTask(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={styles.container}>
        <div style={styles.leftColumn}>
          <h2 style={styles.title}>Task Form</h2>
          <TaskForm
            onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
            initialData={selectedTask}
            onCancel={handleCancelEdit}
          />
        </div>
        <div style={styles.rightColumn}>
          <h2 style={styles.title}>Task List</h2>
          {isLoading ? (
            <div style={styles.loadingMessage}>Loading tasks...</div>
          ) : tasks.length > 0 ? (
            <TaskList tasks={tasks} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} />
          ) : (
            <div style={styles.noTasksMessage}>
              <img src={taskImage} alt="No tasks" style={styles.noTasksImage} />
              <p>No tasks for this project</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
  },
  leftColumn: {
    flex: '0 0 45%',
    paddingRight: '20px',
    overflowY: 'auto',
  },
  rightColumn: {
    flex: '0 0 50%',
    borderLeft: '1px solid #ccc',
    paddingLeft: '20px',
    overflowY: 'auto',
  },
  noTasksMessage: {
    textAlign: 'center',
    marginTop: '20px',
  },
  noTasksImage: {
    width: '100px',
    height: '100px',
  },
  title: {
    marginBottom: '20px',
    borderBottom: '1px solid #ccc',
    paddingBottom: '10px',
  },
  loadingMessage: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
    fontSize: '16px',
  }
};

export default TaskModal;