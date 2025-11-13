import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ id, title, tasks, color, icon, onEditTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const columnStyles = {
    ...styles.column,
    backgroundColor: isOver ? '#f0f0f0' : '#f8f9fa',
  };

  return (
    <div style={columnStyles}>
      <div style={{ ...styles.columnHeader, borderTopColor: color }}>
        <div style={styles.headerContent}>
          <span style={styles.icon}>{icon}</span>
          <h3 style={styles.columnTitle}>{title}</h3>
        </div>
        <span style={{ ...styles.badge, backgroundColor: color }}>{tasks.length}</span>
      </div>
      
      <div ref={setNodeRef} style={styles.columnContent}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div style={styles.emptyMessage}>
              <p>No tasks</p>
            </div>
          ) : (
            tasks.map(task => (
              <KanbanCard key={task.id} task={task} onEdit={onEditTask} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

const styles = {
  column: {
    flex: '1 1 250px',
    minWidth: '250px',
    maxWidth: '350px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color 0.2s ease',
  },
  columnHeader: {
    padding: '15px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    borderTop: '4px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    fontSize: '20px',
    marginRight: '10px',
  },
  columnTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  columnContent: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    minHeight: '400px',
    maxHeight: 'calc(100vh - 350px)',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '14px',
  }
};

export default KanbanColumn;