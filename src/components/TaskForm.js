import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const TaskForm = ({ onSubmit, initialData, onCancel }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    status: 'pending',
    dueDate: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTaskData(initialData);
      setIsEditing(true);
    } else {
      setTaskData({
        title: '',
        description: '',
        status: 'pending',
        dueDate: '',
      });
      setIsEditing(false);
    }
  }, [initialData]);

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
        <label style={styles.label}>Status</label>
        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="status"
              value="in_progress"
              checked={taskData.status === 'in_progress'}
              onChange={handleChange}
            />
            In Progress
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="status"
              value="completed"
              checked={taskData.status === 'completed'}
              onChange={handleChange}
            />
            Completed
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="status"
              value="pending"
              checked={taskData.status === 'pending'}
              onChange={handleChange}
            />
            Pending
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="status"
              value="cancelled"
              checked={taskData.status === 'cancelled'}
              onChange={handleChange}
            />
            Cancelled
          </label>
        </div>
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
