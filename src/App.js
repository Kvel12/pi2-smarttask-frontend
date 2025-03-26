import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import LoginRegister from './components/LoginRegister';
import { fetchProjects } from './api';
import Swal from 'sweetalert2';

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      
      // Si no hay token y no estamos en la página de login, 
      // reemplazar la historia para evitar volver atrás
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, document.title, '/login');
      }
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
      const response = await fetchProjects();
      setProjects(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading projects', error);
      // Si hay un error 401, probablemente el token expiró
      if (error.response && error.response.status === 401) {
        handleSessionExpired();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'There was a problem loading your projects.'
        });
      }
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
      // Redirigir y reemplazar historia
      window.history.replaceState(null, document.title, '/login');
      window.location.href = '/login';
    });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Componente para rutas privadas
  const PrivateRoute = ({ children, ...rest }) => {
    if (isLoading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading...</p>
        </div>
      );
    }

    return (
      <Route
        {...rest}
        render={({ location }) =>
          isLoggedIn ? (
            children
          ) : (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location }
              }}
            />
          )
        }
      />
    );
  };

  return (
    <Router>
      <div>
        <Switch>
          <Route path="/login">
            {isLoggedIn ? <Redirect to="/" /> : <LoginRegister onLogin={handleLogin} />}
          </Route>
          <PrivateRoute exact path="/">
            <ProjectList
              projects={projects}
              onSelectProject={(project) => {
                setSelectedProject(project);
              }}
              onDeleteProject={loadProjects}
            />
          </PrivateRoute>
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
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  }
};

export default App;