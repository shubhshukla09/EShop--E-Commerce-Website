import React from 'react';
import { Link } from 'react-router-dom';

const Orders = () => {
  return (
    <div className="container" style={{ paddingTop: '50px' }}>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h2>My Orders</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            This page would show your order history with status updates and tracking information.
          </p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Orders;
