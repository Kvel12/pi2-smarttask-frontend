import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ProjectForm = ({ onSubmit, onClose, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [culminationDate, setCulminationDate] = useState('');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCulminationDate(initialData.culmination_date || '');
      setPriority(initialData.priority || 'medium');
    }
  }, [initialData]);

  const handlePriorityChange = (value) => {
    setPriority(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      title,
      description,
      culmination_date: culminationDate,
      priority,
    };
    onSubmit(formData);
  };

  return (
    <div>
      <h2 style={styles.modalTitle}>{initialData ? 'Edit Project' : 'New Project'}</h2>
      <hr style={styles.divider} />
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="title">Title</label>
          <input
            style={styles.input}
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="description">Description</label>
          <textarea
            style={styles.textarea}
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="culmination_date">Culmination Date</label>
          <input
            style={styles.input}
            type="date"
            id="culmination_date"
            name="culmination_date"
            value={culminationDate}
            onChange={(e) => setCulminationDate(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Priority</label>
          <div style={styles.radioGroup}>
            <label
              style={{ ...styles.radioLabel, color: '#dc3545' }} // Rojo para 'high'
              className={priority === 'high' ? 'selected' : ''}
            >
              <input
                type="radio"
                checked={priority === 'high'}
                onChange={() => handlePriorityChange('high')}
              />
              High
            </label>
            <label
              style={{ ...styles.radioLabel, color: '#ffc107' }} // Amarillo para 'medium'
              className={priority === 'medium' ? 'selected' : ''}
            >
              <input
                type="radio"
                checked={priority === 'medium'}
                onChange={() => handlePriorityChange('medium')}
              />
              Medium
            </label>
            <label
              style={{ ...styles.radioLabel, color: '#28a745' }} // Verde para 'low'
              className={priority === 'low' ? 'selected' : ''}
            >
              <input
                type="radio"
                checked={priority === 'low'}
                onChange={() => handlePriorityChange('low')}
              />
              Low
            </label>
          </div>
        </div>
        <div style={styles.buttonGroup}>
          <button type="submit" style={styles.addButton}>
            {initialData ? 'UPDATE' : 'ADD'}
          </button>
          <button type="button" style={styles.cancelButton} onClick={onClose}>
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  modalTitle: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: '15px',
  },
  divider: {
    width: '100%',
    height: '1px',
    backgroundColor: '#ccc',
    margin: '10px 0 20px 0',
  },
  formGroup: {
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
    marginBottom: '10px',
  },
  radioLabel: {
    marginRight: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  addButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '15px 30px',
    cursor: 'pointer',
    borderRadius: '5px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    width: 'calc(50% - 10px)', // Ajustar el ancho para ocupar desde el lateral hasta el centro
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '15px 30px',
    cursor: 'pointer',
    borderRadius: '5px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    width: 'calc(50% - 10px)', // Ajustar el ancho para ocupar desde el lateral hasta el centro
  },
};

export default ProjectForm;
