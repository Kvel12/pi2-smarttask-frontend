import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../assets/login.css';

const API_URL = 'https://smarttask-backend-tcsj.onrender.com';

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
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin ? { username, password } : { username, password, name };
      const response = await axios.post(`${API_URL}${endpoint}`, data);
      const token = response.data.token;
      if (token) {
        sessionStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        onLogin();
        resetForm();
      } else {
        console.error('No token received from the server');
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Unable to complete authentication. Please try again.'
        });
      }
    } catch (error) {
      console.error(`Error ${isLogin ? 'logging in' : 'registering'}`, error);
      Swal.fire({
        icon: 'error',
        title: `Error ${isLogin ? 'logging in' : 'registering'}`,
        text: error.response?.data?.message || 'An error occurred. Please try again.'
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
