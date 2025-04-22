import React, { useState } from 'react';
import { FaChartBar, FaList, FaSignOutAlt, FaTasks } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { logout } from '../api';
import VoiceAssistant from './VoiceAssistant';

const Layout = ({ children, activePage, onPageChange, onLogout }) => {
  // Función simplificada para redireccionar a la raíz/dominio principal
  const redirectToRoot = () => {
    try {
      // Redirigir directamente a la raíz del dominio
      const baseUrl = window.location.origin;
      
      // Limpiar el historial para prevenir navegación "atrás"
      window.history.replaceState(null, document.title, baseUrl);
      
      // Forzar una recarga completa
      window.location.href = baseUrl;
    } catch (error) {
      console.error("Error during redirect:", error);
      // Si todo falla, recarga la página en la ubicación actual
      window.location.reload();
    }
  };

  // Función de logout mejorada
  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 1. Intentar llamar a API logout
          try {
            await logout();
          } catch (error) {
            console.warn("Logout API call failed, proceeding with local logout", error);
          }
          
          // 2. Limpiar todos los tokens posibles
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          
          // 3. Mostrar mensaje de éxito
          Swal.fire({
            title: 'Logged Out!', 
            text: 'You have been successfully logged out.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            // 4. Redireccionar a la raíz
            redirectToRoot();
            if (onLogout) onLogout();
          });
        } catch (error) {
          console.error('Error during logout process:', error);
          
          // Asegurar limpieza de tokens incluso con error
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          
          // Mostrar mensaje y redireccionar
          Swal.fire({
            title: 'Logged Out!', 
            text: 'You have been logged out.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            redirectToRoot();
            if (onLogout) onLogout();
          });
        }
      }
    });
  };

  return (
    <div style={styles.container}>
      {/* Panel lateral */}
      <div style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h2 style={styles.logo}>SmartTask</h2>
        </div>
        
        <nav style={styles.nav}>
          <button
            style={
              activePage === 'dashboard'
                ? { ...styles.navButton, ...styles.activeNavButton }
                : styles.navButton
            }
            onClick={() => onPageChange('dashboard')}
          >
            <FaChartBar style={styles.navIcon} />
            Dashboard
          </button>
          
          <button
            style={
              activePage === 'projects'
                ? { ...styles.navButton, ...styles.activeNavButton }
                : styles.navButton
            }
            onClick={() => onPageChange('projects')}
          >
            <FaList style={styles.navIcon} />
            Projects
          </button>
        </nav>
        
        <div style={styles.bottomNav}>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt style={styles.navIcon} />
            Logout
          </button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {activePage === 'dashboard' ? 'Dashboard' : 'Projects'}
          </h1>
        </header>
        
        <main style={styles.mainContent}>
          {children}
        </main>
        
        {/* Asistente Virtual (siempre visible) */}
        <VoiceAssistant />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Roboto, sans-serif',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#512da8',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    padding: '0 20px 20px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    flex: 1,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  activeNavButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeft: '4px solid white',
  },
  navIcon: {
    marginRight: '10px',
    fontSize: '18px',
  },
  bottomNav: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '20px 0',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'white',
    padding: '15px 30px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  mainContent: {
    padding: '30px',
    flex: 1,
    overflowY: 'auto',
  },
};

export default Layout;