import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { fetchProjectStatuses } from '../api';

const TaskForm = ({ onSubmit, initialData, onCancel, projectId }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    status: '',
    dueDate: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  // Fetch available statuses from the project
  useEffect(() => {
    if (projectId) {
      setLoadingStatuses(true);
      fetchProjectStatuses(projectId)
        .then(response => {
          const projectStatuses = response.data.statuses || [];
          setStatuses(projectStatuses);

          // Set default status to first column if not editing
          if (!initialData && projectStatuses.length > 0) {
            setTaskData(prev => ({
              ...prev,
              status: projectStatuses[0].id
            }));
          }
          setLoadingStatuses(false);
        })
        .catch(error => {
          console.error('Error fetching statuses:', error);
          setLoadingStatuses(false);
          Swal.fire('Error', 'Could not load statuses for this project.', 'error');
        });
    }
  }, [projectId, initialData]);

  useEffect(() => {
    if (initialData) {
      setTaskData(initialData);
      setIsEditing(true);
    } else if (statuses.length > 0) {
      setTaskData({
        title: '',
        description: '',
        status: statuses[0].id,
        dueDate: '',
      });
      setIsEditing(false);
    }
  }, [initialData, statuses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación de campos
    if (!taskData.title || !taskData.description || !taskData.dueDate) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please fill out all fields!',
      });
      return;
    }

    onSubmit(taskData);

    // Limpiar el formulario después de enviar si no está en modo de edición
    if (!isEditing) {
      setTaskData({
        title: '',
        description: '',
        status: 'pending',
        dueDate: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label} htmlFor="title">Task Title</label>
        <input
          style={styles.input}
          type="text"
          id="title"
          name="title"
          value={taskData.title}
          onChange={handleChange}
          placeholder="Enter title"
          required
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label} htmlFor="description">Description</label>
        <textarea
          style={styles.textarea}
          id="description"
          name="description"
          value={taskData.description}
          onChange={handleChange}
          placeholder="Enter description"
          required
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label} htmlFor="status">Status</label>
        {loadingStatuses ? (
          <p>Loading statuses...</p>
        ) : (
          <select
            style={styles.select}
            id="status"
            name="status"
            value={taskData.status}
            onChange={handleChange}
            required
          >
            <option value="">Select status</option>
            {statuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.icon} {status.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <div style={styles.field}>
        <label style={styles.label} htmlFor="dueDate">Due Date</label>
        <input
          style={styles.input}
          type="date"
          id="dueDate"
          name="dueDate"
          value={taskData.dueDate}
          onChange={handleChange}
          required
        />
      </div>
      <div style={styles.actions}>
        <button type="submit" style={styles.addButton}>
          {isEditing ? 'Update' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} style={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  field: {
    marginBottom: '15px',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  input: {
    border: 'none',
    borderBottom: '1px solid #ccc',
    padding: '5px 0',
    width: '100%',
    marginBottom: '10px',
    fontSize: '16px',
  },
  select: {
    border: '1px solid #ccc',
    padding: '10px',
    width: '100%',
    marginBottom: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },
  textarea: {
    border: '1px solid #ccc',
    padding: '10px',
    width: '100%',
    marginBottom: '10px',
    fontSize: '16px',
  },
  radioGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  radioLabel: {
    marginRight: '20px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  addButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    width: 'calc(50% - 5px)',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    width: 'calc(50% - 5px)',
  },
  imageContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  image: {
    width: '100px',
    height: '100px',
  },
};

export default TaskForm;
