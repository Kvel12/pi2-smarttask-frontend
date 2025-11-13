import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaCalendarAlt, FaEdit, FaClock } from 'react-icons/fa';

const KanbanCard = ({ task, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  // Calcular días restantes
  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(dateString);
      deadline.setHours(0, 0, 0, 0);
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const daysUntil = getDaysUntil(task.completion_date);
  const isOverdue = daysUntil !== null && daysUntil < 0;
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div style={{
        ...styles.card,
        borderLeft: isOverdue ? '4px solid #dc3545' : isUrgent ? '4px solid #ffc107' : '4px solid #512da8'
      }}>
        <div style={styles.cardHeader}>
          <h4 style={styles.cardTitle}>{task.title}</h4>
          <button
            style={styles.editButton}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit task"
          >
            <FaEdit />
          </button>
        </div>
        
        {task.description && (
          <p style={styles.cardDescription}>{task.description}</p>
        )}
        
        <div style={styles.cardFooter}>
          <div style={styles.dateInfo}>
            <FaCalendarAlt style={styles.dateIcon} />
            <span style={styles.dateText}>{formatDate(task.completion_date)}</span>
          </div>
          
          {daysUntil !== null && (
            <div style={{
              ...styles.badge,
              backgroundColor: isOverdue ? '#dc3545' : isUrgent ? '#ffc107' : '#28a745',
              color: isUrgent ? '#000' : '#fff'
            }}>
              <FaClock style={styles.badgeIcon} />
              {isOverdue 
                ? `${Math.abs(daysUntil)}d overdue` 
                : daysUntil === 0 
                  ? 'Today' 
                  : `${daysUntil}d left`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'grab',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    }
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    flex: 1,
    lineHeight: '1.4',
  },
  editButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#512da8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    fontSize: '14px',
  },
  cardDescription: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
  dateInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    color: '#666',
  },
  dateIcon: {
    marginRight: '4px',
    fontSize: '10px',
  },
  dateText: {
    fontSize: '11px',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
  },
  badgeIcon: {
    marginRight: '4px',
    fontSize: '9px',
  }
};

export default KanbanCard;