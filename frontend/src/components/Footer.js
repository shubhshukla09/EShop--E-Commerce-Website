import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>E-Shop</h3>
          <p>Your one-stop destination for quality products at amazing prices. We offer secure payment processing and fast delivery.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/products">Products</a></li>
            <li><a href="/cart">Shopping Cart</a></li>
            <li><a href="/orders">My Orders</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Customer Service</h3>
          <ul>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/shipping">Shipping Info</a></li>
            <li><a href="/returns">Returns</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Connect With Us</h3>
          <ul>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Facebook</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Twitter</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Instagram</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>LinkedIn</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 E-Shop. All rights reserved. Built with React, Node.js, and Stripe.</p>
      </div>
    </footer>
  );
};

export default Footer;
