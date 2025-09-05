import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersAPI, formatCurrency, formatDate, handleApiError } from '../utils/api';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await ordersAPI.getById(orderId);
        setOrder(response.data.order);
        setError(null);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingTop: '50px' }}>
        <div className="alert alert-error">
          <h3>Error Loading Order</h3>
          <p>{error || 'Order not found'}</p>
          <Link to="/orders" className="btn btn-primary">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '50px' }}>
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 40px' }}>
          {/* Success Icon */}
          <div style={{ fontSize: '5rem', marginBottom: '20px', color: '#28a745' }}>
            ✅
          </div>
          
          <h1 style={{ color: '#28a745', marginBottom: '15px' }}>
            Order Confirmed!
          </h1>
          
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
            Thank you for your purchase. Your order has been successfully processed.
          </p>
          
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            padding: '30px', 
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Order Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <strong>Order Number:</strong><br />
                <span style={{ color: '#666' }}>{order.orderNumber}</span>
              </div>
              <div>
                <strong>Order Date:</strong><br />
                <span style={{ color: '#666' }}>{formatDate(order.createdAt)}</span>
              </div>
              <div>
                <strong>Payment Status:</strong><br />
                <span style={{ color: '#28a745' }}>
                  {order.isPaid ? '✅ Paid' : '❌ Pending'}
                </span>
              </div>
              <div>
                <strong>Total Amount:</strong><br />
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div style={{ marginBottom: '20px' }}>
              <strong>Shipping Address:</strong><br />
              <span style={{ color: '#666' }}>
                {order.shippingAddress.name}<br />
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                {order.shippingAddress.country}
              </span>
            </div>
            
            {/* Order Items */}
            <div>
              <strong>Items Ordered:</strong>
              <div style={{ marginTop: '15px' }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: index < order.items.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <img 
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.name}
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover', 
                          borderRadius: '4px' 
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/orders/${order._id}`} className="btn btn-primary btn-lg">
              View Order Details
            </Link>
            <Link to="/products" className="btn btn-outline btn-lg">
              Continue Shopping
            </Link>
            <Link to="/orders" className="btn btn-secondary">
              View All Orders
            </Link>
          </div>
          
          {/* Additional Info */}
          <div style={{ 
            marginTop: '40px', 
            padding: '20px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <h4 style={{ marginBottom: '10px', color: '#1976d2' }}>What's Next?</h4>
            <p style={{ margin: '5px 0', color: '#666' }}>
              📧 You'll receive an email confirmation shortly
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              📦 We'll notify you when your order ships
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              🚚 Estimated delivery: 3-5 business days
            </p>
            {order.shippingPrice === 0 && (
              <p style={{ margin: '5px 0', color: '#28a745', fontWeight: '500' }}>
                🎉 Congratulations! You qualified for free shipping
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
