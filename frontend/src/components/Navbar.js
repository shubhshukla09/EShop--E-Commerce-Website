import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          🛒 E-Shop
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li>
            <Link to="/products" className="nav-link">
              Products
            </Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/orders" className="nav-link">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="nav-link">
                  Profile
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  style={{ marginLeft: '10px' }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </li>
            </>
          )}
          
          <li>
            <Link to="/cart" className="nav-link cart-icon">
              🛒
              {totalItems > 0 && (
                <span className="cart-count">{totalItems}</span>
              )}
            </Link>
          </li>
          
          {isAuthenticated && user && (
            <li style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
              Hi, {user.name}
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
