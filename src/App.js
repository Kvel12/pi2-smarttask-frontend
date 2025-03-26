import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import LoginRegister from './components/LoginRegister';
import { fetchProjects, fetchTasks } from './api';

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadProjects();
    }
  }, [isLoggedIn]);

  const loadProjects = async () => {
    try {
      const response = await fetchProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects', error);
    }
  };

  const loadTasks = async (projectId) => {
    try {
      const response = await fetchTasks(projectId);
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks', error);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const PrivateRoute = ({ children, ...rest }) => {
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
          <PrivateRoute path="/">
            <div>
              <ProjectList
                projects={projects}
                onSelectProject={(project) => {
                  setSelectedProject(project);
                  loadTasks(project.id);
                }}
                onDeleteProject={loadProjects}
              />
              {selectedProject && (
                <div>
                  <h2>Tasks for {selectedProject.name}</h2>
                  <TaskForm projectId={selectedProject.id} onAddTask={() => loadTasks(selectedProject.id)} />
                  <TaskList tasks={tasks} onDeleteTask={() => loadTasks(selectedProject.id)} />
                </div>
              )}
            </div>
          </PrivateRoute>
        </Switch>
      </div>
    </Router>
  );
}

export default App;