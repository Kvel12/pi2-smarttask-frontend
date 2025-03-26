import React from 'react';
import { FaClock, FaExclamationCircle, FaTrash, FaEdit } from 'react-icons/fa';

const TaskList = ({ tasks, onEditTask, onDeleteTask }) => {
  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : 'Invalid Date';
  };

  // Función para obtener el estilo del estado
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: 'rgba(40, 167, 69, 0.2)', padding: '3px 6px', borderRadius: '4px', color: '#28a745' };
      case 'in_progress':
        return { backgroundColor: 'rgba(0, 123, 255, 0.2)', padding: '3px 6px', borderRadius: '4px', color: '#007bff' };
      case 'pending':
        return { backgroundColor: 'rgba(255, 193, 7, 0.2)', padding: '3px 6px', borderRadius: '4px', color: '#ffc107' };
      case 'cancelled':
        return { backgroundColor: 'rgba(108, 117, 125, 0.2)', padding: '3px 6px', borderRadius: '4px', color: '#6c757d' };
      default:
        return {};
    }
  };

  // Función para formatear el estado para mostrar
  const formatStatus = (status) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  return (
    <div style={styles.container}>
      {tasks.length === 0 ? (
        <p style={styles.noTasksText}>No tasks available for this project.</p>
      ) : (
        <ul style={styles.taskList}>
          {tasks.map((task) => (
            <li key={task.id} style={styles.taskItem}>
              <div style={styles.taskHeader}>
                <h3 style={styles.taskTitle}>{task.title}</h3>
                <div style={styles.taskActions}>
                  {onEditTask && (
                    <button 
                      style={styles.editButton} 
                      onClick={() => onEditTask(task)}
                      title="Edit Task"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {onDeleteTask && (                     
                    <button 
                      style={styles.deleteButton} 
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete Task"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              
              <p style={styles.taskDescription}>{task.description}</p>
              
              <div style={styles.taskMeta}>
                <span style={styles.metaItem}>
                  <FaClock style={styles.metaIcon} /> 
                  <span style={styles.metaLabel}>Due:</span> {formatDate(task.dueDate)}
                </span>
                <span style={styles.metaItem}>
                  <FaExclamationCircle style={styles.metaIcon} /> 
                  <span style={styles.metaLabel}>Status:</span> 
                  <span style={getStatusStyle(task.status)}>{formatStatus(task.status)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  taskList: {
    listStyle: 'none',
    padding: 0,
  },
  taskItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  taskTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#512da8',
  },
  taskActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  taskDescription: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px',
  },
  taskMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#666',
  },
  metaIcon: {
    marginRight: '5px',
    fontSize: '14px',
  },
  metaLabel: {
    fontWeight: 'bold',
    marginRight: '5px',
  },
  noTasksText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: '20px',
  }
};

export default TaskList;