// src/components/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, addUser } from '../services/auth';
import style from "../style/auth.module.scss";

const Auth = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLoginView) {
      await handleLogin();
    } else {
      await handleSignup();
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const user = await getUser(username);
      
      if (!user) {
        setError('User not found');
        return;
      }

      if (user.password !== password) {
        setError('Invalid password');
        return;
      }

      onLogin(username);
      navigate('/search');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const existingUser = await getUser(username);
      if (existingUser) {
        setError('Username already exists');
        return;
      }

      await addUser(username, password);
      setSuccess('Account created successfully! You can now login.');
      setIsLoginView(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="container">
      <h2 className="heading">{isLoginView ? 'Login' : 'Sign Up'}</h2>
      
      {success && <div className={`${style.success} ${style.message}`}>{success}</div>}
      {error && <div className={`${style.error}  ${style.message}`}>{error}</div>}

      <form onSubmit={handleSubmit} className={style.authForm}>
        <div className={style.formGroup}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={style.inputField}
          />
        </div>

        <div className={style.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={style.inputField}
          />
        </div>

        {!isLoginView && (
          <div className={style.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={style.inputField}
            />
          </div>
        )}

        <button type="submit" className={style.authButton}>
          {isLoginView ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <div className={style.toggleView}>
        {isLoginView ? (
          <p>
            Don't have an account?{' '}
            <button 
              onClick={() => setIsLoginView(false)}
              className={style.toggleButton}
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button 
              onClick={() => setIsLoginView(true)}
              className={style.toggleButton}
            >
              Login
            </button>
          </p>
        )}
      </div>

    </div>
  );
};

export default Auth;