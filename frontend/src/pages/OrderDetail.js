import React from 'react';
import { useParams, Link } from 'react-router-dom';

const OrderDetail = () => {
  const { id } = useParams();

  return (
    <div className="container" style={{ paddingTop: '50px' }}>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h2>Order Detail</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Order ID: {id}
          </p>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            This page would show detailed order information, tracking status, and shipping details.
          </p>
          <Link to="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
