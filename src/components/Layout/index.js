import React from 'react';
import { FaChartBar, FaList, FaSignOutAlt } from 'react-icons/fa';
import VoiceAssistant from '../VoiceAssistant'; // Importamos el asistente virtual

const Layout = ({ children, activePage, onPageChange, onLogout }) => {
  // Función para manejar la creación de tareas desde el asistente
  const handleVoiceTaskCreated = () => {
    // Esta función se puede mejorar para actualizar los proyectos si es necesario
    console.log("Tarea creada por voz desde el asistente global");
    // Si tienes acceso a la función de actualización de proyectos, podrías llamarla aquí
  };

  return (
    <div style={styles.container}>
      {/* Navbar superior */}
      <nav style={styles.navbar}>
        <h1 style={styles.title}>SmartTask Project Manager</h1>
        <button 
          style={styles.logoutButton}
          onClick={onLogout}
        >
          LOGOUT <FaSignOutAlt style={styles.icon} />
        </button>
      </nav>
      
      {/* Tabs de navegación */}
      <div style={styles.tabs}>
        <button 
          style={activePage === 'dashboard' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => onPageChange('dashboard')}
        >
          <FaChartBar style={styles.tabIcon} /> Dashboard
        </button>
        <button 
          style={activePage === 'projects' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => onPageChange('projects')}
        >
          <FaList style={styles.tabIcon} /> Projects
        </button>
      </div>
      
      {/* Contenido principal */}
      <div style={styles.content}>
        {children}
      </div>

      {/* Asistente Virtual (ahora a nivel de Layout) */}
      <VoiceAssistant onCreateTask={handleVoiceTaskCreated} />
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#512da8',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
  },
  icon: {
    marginLeft: '10px',
  },
  tabs: {
    display: 'flex',
    backgroundColor: '#fff',
    padding: '0 20px',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    margin: '0 10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#666',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    borderBottom: '3px solid #512da8',
    color: '#512da8',
  },
  tabIcon: {
    marginRight: '8px',
  },
  content: {
    flex: 1,
    padding: '20px',
  }
};

export default Layout;