import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { updateTask } from '../api';
import Swal from 'sweetalert2';
import { useApp } from '../App';

const KanbanBoard = ({ projectId, tasks, kanbanColumns }) => {
  const { refreshProjects } = useApp();
  const [activeTask, setActiveTask] = useState(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  // Columnas por defecto (fallback si no se especifican columnas personalizadas)
  const defaultColumns = [
    { id: 'pending', title: 'Pending', color: '#ffc107', icon: '📋' },
    { id: 'in_progress', title: 'In Progress', color: '#007bff', icon: '🔄' },
    { id: 'completed', title: 'Completed', color: '#28a745', icon: '✅' },
    { id: 'cancelled', title: 'Cancelled', color: '#6c757d', icon: '❌' }
  ];

  // Usar columnas personalizadas si existen, sino usar las por defecto
  const columns = kanbanColumns && kanbanColumns.length > 0 ? kanbanColumns : defaultColumns;

  // Actualizar tareas locales cuando cambian las props
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organizar tareas por estado (dinámico según las columnas disponibles)
  const tasksByStatus = {};
  columns.forEach(column => {
    tasksByStatus[column.id] = localTasks.filter(t => t.status === column.id);
  });

  // Crear el array de columnas con sus tareas
  const columnsWithTasks = columns.map(column => ({
    ...column,
    tasks: tasksByStatus[column.id] || []
  }));

  const handleDragStart = (event) => {
    const { active } = event;
    const task = localTasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Encontrar la tarea que se movió
    const task = localTasks.find(t => t.id === taskId);
    
    if (!task) return;

    // Si el estado no cambió, no hacer nada
    if (task.status === newStatus) return;

    // Verificar que el nuevo estado sea válido (existe en las columnas)
    const validStatus = columns.find(col => col.id === newStatus);
    if (!validStatus) {
      console.error('Invalid status:', newStatus);
      return;
    }

    // Actualizar localmente de inmediato para feedback visual
    const updatedTasks = localTasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setLocalTasks(updatedTasks);

    try {
      // Actualizar en el backend
      await updateTask(taskId, {
        title: task.title,
        description: task.description,
        status: newStatus,
        completion_date: task.completion_date,
        creation_date: task.creation_date,
        projectId: projectId
      });

      console.log(`✅ Task ${taskId} updated to ${newStatus}`);
      
      // Refrescar proyectos para actualizar toda la UI
      refreshProjects();

      // Mostrar notificación de éxito
      Swal.fire({
        icon: 'success',
        title: 'Task Updated!',
        text: `Task moved to ${validStatus.title}`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('Error updating task:', error);
      
      // Revertir cambio local si falla
      setLocalTasks(tasks);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not update task status. Please try again.',
      });
    }
  };

  const handleEditTask = (task) => {
    // Esta función será manejada por el componente padre (KanbanPage)
    // Por ahora, mostrar un mensaje
    Swal.fire({
      icon: 'info',
      title: 'Edit Task',
      text: 'Edit functionality will be implemented through the task modal.',
      confirmButtonText: 'OK'
    });
  };

  return (
    <div style={styles.container}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={styles.columnsContainer}>
          {columnsWithTasks.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              icon={column.icon}
              tasks={column.tasks}
              onEditTask={handleEditTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} onEdit={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  columnsContainer: {
    display: 'flex',
    gap: '20px',
    overflowX: 'auto',
    paddingBottom: '20px',
  }
};

export default KanbanBoard;