import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LoginRegister from './components/LoginRegister';
import { fetchProjects } from './api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import KanbanPage from './components/KanbanPage'; // ✅ NUEVO IMPORT
import Swal from 'sweetalert2';

// Al principio del archivo, después de los imports
console.log('🔍 DEBUG - Variables de entorno:');
console.log('REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Todas las env:', process.env);

// ==================== CONTEXT API ====================
// Crear contexto global para proyectos y actualización
export const AppContext = createContext();

// Hook personalizado para usar el contexto
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};
// ====================================================

function App() {
  const [projects, setProjects] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Obtener URL base para redirecciones consistentes
  const getBaseUrl = () => {
    return window.location.origin;
  };

  // Verificar token al cargar la app y en cada cambio de historia
  useEffect(() => {
    checkAuthentication();
    
    // Escuchar eventos de navegación para verificar autenticación
    window.addEventListener('popstate', checkAuthentication);
    
    return () => {
      window.removeEventListener('popstate', checkAuthentication);
    };
  }, []);

  // Función centralizada para verificar autenticación
  const checkAuthentication = () => {
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    setIsLoading(false);
  };

  // Cargar proyectos cuando el usuario inicia sesión o cuando se dispara refresh
  useEffect(() => {
    if (isLoggedIn) {
      loadProjects();
    }
  }, [isLoggedIn, refreshTrigger]);

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await fetchProjects();
      setProjects(response.data || []);
      console.log('✅ Proyectos cargados:', response.data.length);
    } catch (error) {
      console.error('Error loading projects', error);
      // Si hay un error 401, probablemente el token expiró
      if (error.response && error.response.status === 401) {
        handleSessionExpired();
      } else {
        setError('Error loading projects. Please try again.');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'There was a problem loading your projects.'
        });
      }
    }
  };

  // Función para refrescar proyectos desde cualquier componente
  const refreshProjects = () => {
    console.log('🔄 Refrescando proyectos...');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSessionExpired = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    
    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.'
    }).then(() => {
      window.history.replaceState(null, document.title, getBaseUrl());
      window.location.href = getBaseUrl();
    });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Valor del contexto que se compartirá con todos los componentes
  const contextValue = {
    projects,
    refreshProjects,
    loadProjects,
    isLoading
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div>
          <Switch>
            <Route path="/login">
              {isLoggedIn ? <Redirect to="/" /> : <LoginRegister onLogin={handleLogin} />}
            </Route>
            <Route exact path="/">
              {!isLoggedIn ? (
                <Redirect to="/login" />
              ) : (
                <Layout 
                  activePage={activePage} 
                  onPageChange={handlePageChange}
                  onLogout={handleLogout}
                >
                  {error ? (
                    <div style={styles.errorContainer}>
                      <div style={styles.errorMessage}>
                        <h3>Error Loading Data</h3>
                        <p>{error}</p>
                        <button 
                          style={styles.retryButton}
                          onClick={loadProjects}
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : activePage === 'dashboard' ? (
                    <Dashboard projects={projects} />
                  ) : activePage === 'projects' ? (
                    <ProjectList 
                      projects={projects} 
                      onProjectUpdate={refreshProjects}
                    />
                  ) : activePage === 'kanban' ? ( // ✅ NUEVO: Página Kanban
                    <KanbanPage />
                  ) : null}
                </Layout>
              )}
            </Route>
            <Route path="*">
              <Redirect to={isLoggedIn ? "/" : "/login"} />
            </Route>
          </Switch>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  loadingSpinner: {
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #512da8',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  errorMessage: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '500px',
  },
  retryButton: {
    backgroundColor: '#512da8',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    marginTop: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }
};

export default App;