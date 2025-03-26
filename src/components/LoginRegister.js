import React, { useState } from 'react';
import Swal from 'sweetalert2';
import '../assets/login.css';

// Componente para el formulario de inicio de sesión
const LoginForm = ({ username, password, setUsername, setPassword, handleSubmit }) => (
  <form onSubmit={handleSubmit}>
    <h1>Sign In</h1>
    <div className="social-icons">
      <a href="#" className="icon"><i className="fa-brands fa-google-plus-g"></i></a>
      <a href="#" className="icon"><i className="fa-brands fa-facebook-f"></i></a>
      <a href="#" className="icon"><i className="fa-brands fa-github"></i></a>
      <a href="#" className="icon"><i className="fa-brands fa-linkedin-in"></i></a>
    </div>
    <span>or use your username to log in</span>
    <input
      type="text"
      placeholder="Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      aria-label="Username"
      required
    />
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      aria-label="Password"
      required
    />
    <a href="#">Forgot your password?</a>
    <button type="submit">Log In</button>
  </form>
);

// Componente para el formulario de registro
const RegisterForm = ({ name, username, password, setName, setUsername, setPassword, handleSubmit }) => (
  <form onSubmit={handleSubmit}>
    <h1>Create Account</h1>
    <div className="social-icons">
      <a href="#" className="icon"><i className="fa-brands fa-google-plus-g"></i></a>
      <a href="#" className="icon"><i className="fa-brands fa-facebook-f"></i></a>
      <a href="#" className="icon"><i className="fa-brands fa-github"></i></a>
      <a href="#" className="icon"><i className="fa-brands fa-linkedin-in"></i></a>
    </div>
    <span>or use your username to sign up</span>
    <input
      type="text"
      placeholder="Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      aria-label="Name"
      required
    />
    <input
      type="text"
      placeholder="Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      aria-label="Username"
      required
    />
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      aria-label="Password"
      required
    />
    <button type="submit">Sign Up</button>
  </form>
);

const LoginRegister = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!username || !password || (!isLogin && !name)) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in all fields.'
      });
      return;
    }

    try {
      // Definir el proxy CORS y la URL del backend
      const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';
      const API_URL = 'https://smarttask-backend-tcsj.onrender.com/api';
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin ? { username, password } : { username, password, name };
      
      console.log(`Intentando ${isLogin ? 'login' : 'registro'} con:`, data);
      
      // Usar fetch con el proxy CORS
      const response = await fetch(CORS_PROXY + API_URL + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://pi2-smarttask-frontend.vercel.app/'  // Añadimos el origen como header
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Respuesta:', result);
      
      const token = result.token;
      if (token) {
        sessionStorage.setItem('token', token);
        onLogin();
        resetForm();
        
        Swal.fire({
          icon: 'success',
          title: isLogin ? 'Login Successful' : 'Registration Successful',
          text: isLogin ? 'Welcome back!' : 'Your account has been created!',
          timer: 1500
        });
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error(`Error ${isLogin ? 'logging in' : 'registering'}`, error);
      Swal.fire({
        icon: 'error',
        title: `Error ${isLogin ? 'logging in' : 'registering'}`,
        text: error.message || 'An error occurred. Please try again.'
      });
    }
  };

  return (
    <div className={`container ${!isLogin ? 'active' : ''}`} id="container">
      <div className="form-container sign-up">
        <RegisterForm
          name={name}
          username={username}
          password={password}
          setName={setName}
          setUsername={setUsername}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
        />
      </div>
      <div className="form-container sign-in">
        <LoginForm
          username={username}
          password={password}
          setUsername={setUsername}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
        />
      </div>
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Welcome Back!</h1>
            <p>Enter your personal details to access all site features</p>
            <button className="hidden" onClick={() => setIsLogin(true)}>
              Log In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>¡Welcome to SmartTask!</h1>
            <p>Organize, manage, and optimize your projects and tasks with our intelligent platform.</p>
            <button className="hidden" onClick={() => setIsLogin(false)}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;