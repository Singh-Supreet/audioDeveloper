import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SoundSearch from './components/SoundSearch';
import RecordAudio from './components/RecordAudio';
import MyLibrary from './components/MyLibrary';
import MixAudio from './components/MixAudio';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  const toggleNav = () => setIsNavOpen(!isNavOpen);

  useEffect(() => {
    const token = localStorage.getItem('audioAppToken');
    if (token) {
      setIsAuthenticated(true);
      setUser({ username: localStorage.getItem('audioAppUsername') });
    }
  }, []);

  const handleLogin = (username) => {
    localStorage.setItem('audioAppToken', 'demo_token');
    localStorage.setItem('audioAppUsername', username);
    setIsAuthenticated(true);
    setUser({ username });
  };

  const handleLogout = () => {
    localStorage.removeItem('audioAppToken');
    localStorage.removeItem('audioAppUsername');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1>Audio Mixer</h1>
          <button className="hamburger" onClick={toggleNav}>
            ☰
          </button>
          <div className={`nav-links ${isNavOpen ? 'open' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link to="/search" onClick={() => setIsNavOpen(false)}>Sound Search</Link>
                <Link to="/record" onClick={() => setIsNavOpen(false)}>Record Audio</Link>
                <Link to="/library" onClick={() => setIsNavOpen(false)}>My Library</Link>
                <Link to="/mix" onClick={() => setIsNavOpen(false)}>Mix Audio</Link>
                <button onClick={() => { handleLogout(); setIsNavOpen(false); }}>Logout</button>
                <span className="username-display">Welcome, {user?.username}</span>
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsNavOpen(false)}>Login</Link>
            )}
          </div>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
            {isAuthenticated ? (
              <>
                <Route path="/search" element={<SoundSearch />} />
                <Route path="/record" element={<RecordAudio />} />
                <Route path="/library" element={<MyLibrary />} />
                <Route path="/mix" element={<MixAudio />} />
                <Route path="/" element={<SoundSearch />} />
              </>
            ) : (
              <Route path="*" element={<Auth onLogin={handleLogin} />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;