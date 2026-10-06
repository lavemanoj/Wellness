import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthPages({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDemoLogin = () => {
    // Check if demo user exists, if not, create it
    const users = JSON.parse(localStorage.getItem('ats_users') || '[]');
    let demoUser = users.find(u => u.email === 'demo@example.com');
    if (!demoUser) {
      demoUser = {
        email: 'demo@example.com',
        password: 'password123',
        fullName: 'John Doe',
        resumeData: null
      };
      users.push(demoUser);
      localStorage.setItem('ats_users', JSON.stringify(users));
    }
    
    localStorage.setItem('ats_current_user', JSON.stringify(demoUser));
    onAuthSuccess(demoUser);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || (!isLogin && !fullName)) {
      setError('Please fill in all fields.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('ats_users') || '[]');

    if (isLogin) {
      // Login flow
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('ats_current_user', JSON.stringify(user));
        setTimeout(() => {
          onAuthSuccess(user);
        }, 1000);
      } else {
        setError('Invalid email or password.');
      }
    } else {
      // Signup flow
      const userExists = users.some(u => u.email === email);
      if (userExists) {
        setError('An account with this email already exists.');
        return;
      }

      const newUser = {
        email,
        password,
        fullName,
        resumeData: null
      };

      users.push(newUser);
      localStorage.setItem('ats_users', JSON.stringify(users));
      setSuccess('Registration successful! Please login.');
      setTimeout(() => {
        setIsLogin(true);
        // Clear signup fields
        setFullName('');
        setPassword('');
      }, 1500);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-glow-effect"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <FileText size={32} />
          </div>
          <h1>ATS Resume Builder</h1>
          <p>{isLogin ? 'Sign in to create & manage your resumes' : 'Create an account to build your resume'}</p>
        </div>

        {error && (
          <div className="auth-message auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-message auth-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button onClick={handleDemoLogin} className="demo-login-btn">
          Try with Demo Account
        </button>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }} 
              className="auth-toggle-btn"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
