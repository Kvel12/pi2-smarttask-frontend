import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ProjectForm = ({ onSubmit, onClose, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [culminationDate, setCulminationDate] = useState('');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [kanbanTemplate, setKanbanTemplate] = useState('default');

  // Definición de plantillas
  const kanbanTemplates = {
    default: {
      name: 'Default',
      description: 'Standard workflow template',
      columns: [
        { id: 'pending', title: 'Pending', color: '#ffc107', icon: '📋' },
        { id: 'in_progress', title: 'In Progress', color: '#007bff', icon: '🔄' },
        { id: 'completed', title: 'Completed', color: '#28a745', icon: '✅' },
        { id: 'cancelled', title: 'Cancelled', color: '#6c757d', icon: '❌' }
      ]
    },
    architecture: {
      name: 'Architecture',
      description: 'Software architecture workflow',
      columns: [
        { id: 'requirements', title: 'Requerimientos', color: '#e91e63', icon: '📝' },
        { id: 'design', title: 'Diseño', color: '#9c27b0', icon: '🎨' },
        { id: 'construction', title: 'Construcción', color: '#2196f3', icon: '🏗️' },
        { id: 'validation', title: 'Validación', color: '#4caf50', icon: '✔️' }
      ]
    },
    systems_engineering: {
      name: 'Systems Engineering',
      description: 'Systems engineering workflow',
      columns: [
        { id: 'todo', title: 'Por hacer', color: '#ff9800', icon: '📌' },
        { id: 'in_progress', title: 'En progreso', color: '#03a9f4', icon: '⚙️' },
        { id: 'review', title: 'En revisión', color: '#ff5722', icon: '🔍' },
        { id: 'completed', title: 'Completado', color: '#8bc34a', icon: '✅' }
      ]
    }
  };

  // ✅ Función para normalizar fechas
  const normalizeDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error normalizing date:', error);
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCulminationDate(normalizeDateForInput(initialData.culmination_date));
      setPriority(initialData.priority || 'medium');
      setKanbanTemplate(initialData.kanban_template || 'default');
    }
  }, [initialData]);

  const handlePriorityChange = (value) => {
    setPriority(value);
  };

  const handleTemplateChange = (value) => {
    setKanbanTemplate(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      title,
      description,
      culmination_date: culminationDate,
      priority,
      kanban_template: kanbanTemplate,
      kanban_columns: kanbanTemplates[kanbanTemplate].columns
    };
    console.log('📤 Submitting project data:', formData);
    onSubmit(formData);
  };

  return (
    <div style={styles.modalContainer}>
      <h2 style={styles.modalTitle}>{initialData ? 'Edit Project' : 'New Project'}</h2>
      <hr style={styles.divider} />
      <form onSubmit={handleSubmit} style={styles.form}>
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
            onChange={(e) => {
              console.log('📅 Date changed to:', e.target.value);
              setCulminationDate(e.target.value);
            }}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Priority</label>
          <div style={styles.radioGroup}>
            <label
              style={{ ...styles.radioLabel, color: '#dc3545' }}
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
              style={{ ...styles.radioLabel, color: '#ffc107' }}
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
              style={{ ...styles.radioLabel, color: '#28a745' }}
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

        {/* Nueva sección: Selección de plantilla Kanban */}
        {!initialData && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Kanban Template</label>
            <p style={styles.helperText}>Choose a workflow template for your project</p>
            
            <div style={styles.templateGrid}>
              {Object.entries(kanbanTemplates).map(([key, template]) => (
                <div
                  key={key}
                  style={{
                    ...styles.templateCard,
                    ...(kanbanTemplate === key ? styles.templateCardSelected : {})
                  }}
                  onClick={() => handleTemplateChange(key)}
                >
                  <div style={styles.templateHeader}>
                    <input
                      type="radio"
                      checked={kanbanTemplate === key}
                      onChange={() => handleTemplateChange(key)}
                      style={styles.templateRadio}
                    />
                    <h4 style={styles.templateName}>{template.name}</h4>
                  </div>
                  <p style={styles.templateDescription}>{template.description}</p>
                  <div style={styles.columnPreview}>
                    {template.columns.map((col, idx) => (
                      <div key={idx} style={styles.previewColumn}>
                        <span style={styles.columnIcon}>{col.icon}</span>
                        <span style={styles.columnName}>{col.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
  modalContainer: {
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '5px',
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: '22px',
    marginBottom: '10px',
    marginTop: '5px',
  },
  divider: {
    width: '100%',
    height: '1px',
    backgroundColor: '#ccc',
    margin: '8px 0 15px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '4px',
    display: 'block',
    fontSize: '14px',
  },
  helperText: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
    marginTop: '3px',
  },
  input: {
    border: 'none',
    borderBottom: '1px solid #ccc',
    padding: '4px 0',
    width: '100%',
    marginBottom: '8px',
    fontSize: '14px',
  },
  textarea: {
    border: '1px solid #ccc',
    padding: '8px',
    width: '100%',
    marginBottom: '8px',
    fontSize: '14px',
    borderRadius: '4px',
    minHeight: '60px',
    resize: 'vertical',
  },
  radioGroup: {
    display: 'flex',
    gap: '15px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  radioLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  templateCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#fafafa',
  },
  templateCardSelected: {
    border: '2px solid #512da8',
    backgroundColor: '#f3e5f5',
  },
  templateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  templateRadio: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
  },
  templateName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  templateDescription: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '8px',
    marginLeft: '24px',
  },
  columnPreview: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginLeft: '24px',
  },
  previewColumn: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '10px',
    backgroundColor: '#fff',
    padding: '3px 6px',
    borderRadius: '3px',
    border: '1px solid #ddd',
  },
  columnIcon: {
    fontSize: '11px',
  },
  columnName: {
    color: '#555',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
    gap: '10px',
  },
  addButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    flex: 1,
    fontSize: '14px',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    flex: 1,
    fontSize: '14px',
  },
};

export default ProjectForm;