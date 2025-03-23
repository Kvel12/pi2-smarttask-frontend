import React from 'react';

const TaskList = ({ tasks }) => {
  return (
    <div style={styles.container}>
      <ul style={styles.taskList}>
        {tasks.map((task) => (
          <li key={task.id} style={styles.taskItem}>
            <div style={styles.taskDetails}>
              <span>{task.title}</span>
            </div>
          </li>
        ))}
      </ul>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #ccc',
  },
  taskDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
};

export default TaskList;