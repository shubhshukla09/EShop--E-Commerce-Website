import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, error: authError, loading, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    clearError();
    
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', paddingTop: '50px' }}>
      <div className="card">
        <div className="card-body">
          <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '30px' }}>
            Login to Your Account
          </h2>
          
          {authError && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                disabled={isSubmitting || loading}
              />
              {errors.email && (
                <div className="form-error">{errors.email}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                disabled={isSubmitting || loading}
              />
              {errors.password && (
                <div className="form-error">{errors.password}</div>
              )}
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '20px' }}
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <p style={{ color: '#666' }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                state={{ from: location.state?.from }}
                style={{ color: '#007bff', textDecoration: 'none' }}
              >
                Sign up here
              </Link>
            </p>
          </div>
          
          {/* Demo credentials */}
          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Demo Credentials:</h4>
            <p><strong>Email:</strong> demo@example.com</p>
            <p><strong>Password:</strong> Demo123!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
