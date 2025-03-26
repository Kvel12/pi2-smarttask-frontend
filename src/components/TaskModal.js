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

  useEffect(() => {
    if (isOpen && projectId) {
      fetchTasksByProjectId(projectId)
        .then(response => setTasks(response.data))
        .catch(error => console.error('Error fetching tasks:', error));
    }
  }, [isOpen, projectId]);

  const handleCreateTask = async (taskData) => {
    try {
      const newTask = { ...taskData, projectId };
      const response = await createTask(newTask);
      const createdTask = response.data;
      setTasks([...tasks, createdTask]);
      onCreateTask();
      Swal.fire('Created!', 'The task has been created successfully.', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      Swal.fire('Error', 'There was a problem creating the task.', 'error');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const updatedTask = { ...taskData, projectId };
      const response = await updateTask(taskData.id, updatedTask);
      const updatedTaskFromServer = response.data;
      const updatedTasks = tasks.map(task =>
        task.id === updatedTaskFromServer.id ? updatedTaskFromServer : task
      );
      setTasks(updatedTasks);
      onUpdateTask();
      setSelectedTask(null);
      Swal.fire('Updated!', 'The task has been updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      Swal.fire('Error', 'There was a problem updating the task.', 'error');
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
          onDeleteTask();
          Swal.fire(
            'Deleted!',
            'The task has been deleted.',
            'success'
          );
        } catch (error) {
          console.error('Error deleting task:', error);
          Swal.fire(
            'Error',
            'There was a problem deleting the task.',
            'error'
          );
        }
      }
    });
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
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
          {tasks.length > 0 ? (
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
    maxHeight: '80vh', // Limita la altura máxima a 80% de la altura visible
    overflow: 'hidden', // Oculta el desbordamiento
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
};

export default TaskModal;
