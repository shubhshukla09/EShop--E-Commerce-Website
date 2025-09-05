import React from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="container" style={{ paddingTop: '50px' }}>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h2>Product Detail Page</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Product ID: {id}
          </p>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            This page would show detailed product information, images, reviews, and add to cart functionality.
          </p>
          <Link to="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
