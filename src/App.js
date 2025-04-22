import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LoginRegister from './components/LoginRegister';
import { fetchProjects } from './api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Swal from 'sweetalert2';

function App() {
  const [projects, setProjects] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [error, setError] = useState(null);

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

  // Cargar proyectos cuando el usuario inicia sesión
  useEffect(() => {
    if (isLoggedIn) {
      loadProjects();
    }
  }, [isLoggedIn]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchProjects();
      setProjects(response.data || []);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionExpired = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token'); // Por si acaso
    setIsLoggedIn(false);
    
    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.'
    }).then(() => {
      // Redirigir a la raíz del sitio
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

  // Error boundary para capturar errores en componentes hijos
  useEffect(() => {
    const handleError = (event) => {
      console.error('Error capturado por window.onerror:', event);
      setError('Ocurrió un error en la aplicación. Por favor, recarga la página.');
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
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
                      <h3>Error</h3>
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
                  <React.Suspense fallback={<div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p>Loading Dashboard...</p>
                  </div>}>
                    <Dashboard projects={projects} />
                  </React.Suspense>
                ) : (
                  <React.Suspense fallback={<div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p>Loading Projects...</p>
                  </div>}>
                    <Projects 
                      projects={projects} 
                      onProjectUpdate={loadProjects} 
                    />
                  </React.Suspense>
                )}
              </Layout>
            )}
          </Route>
          <Route path="*">
            <Redirect to={isLoggedIn ? "/" : "/login"} />
          </Route>
        </Switch>
      </div>
    </Router>
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
    borderRadius: '50%',borderRadius: '50%',
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
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  }
};

export default App;