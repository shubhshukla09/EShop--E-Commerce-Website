import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/api';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getCartSummary } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const summary = getCartSummary();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      updateQuantity(productId, newQuantity);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      removeFromCart(productId);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: { pathname: '/checkout' } }
      });
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '50px' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
            <h2>Your Cart is Empty</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Shopping Cart</h1>
        <p style={{ color: '#666' }}>
          {summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''} in your cart
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        {/* Cart Items */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="card" style={{ marginBottom: '20px' }}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '20px', alignItems: 'center' }}>
                  {/* Product Image */}
                  <Link to={`/products/${item.id}`}>
                    <img 
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name}
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </Link>
                  
                  {/* Product Details */}
                  <div>
                    <Link 
                      to={`/products/${item.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <h4 style={{ marginBottom: '10px', color: '#333' }}>
                        {item.name}
                      </h4>
                    </Link>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                      Category: {item.category}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                      Price: {formatCurrency(item.price)}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500' }}>
                        Quantity:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: '8px 12px',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            opacity: item.quantity <= 1 ? 0.5 : 1
                          }}
                        >
                          −
                        </button>
                        <span style={{ 
                          padding: '8px 16px', 
                          borderLeft: '1px solid #ddd',
                          borderRight: '1px solid #ddd',
                          minWidth: '50px',
                          textAlign: 'center'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: '8px 12px',
                            cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                            opacity: item.quantity >= item.stock ? 0.5 : 1
                          }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {item.stock} in stock
                      </span>
                    </div>
                  </div>
                  
                  {/* Item Total and Remove */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Subtotal ({summary.itemCount} items)</span>
                  <span>{formatCurrency(summary.subtotal)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Shipping</span>
                  <span>
                    {summary.shipping === 0 ? (
                      <span style={{ color: '#28a745' }}>FREE</span>
                    ) : (
                      formatCurrency(summary.shipping)
                    )}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Tax</span>
                  <span>{formatCurrency(summary.tax)}</span>
                </div>
                
                <hr style={{ margin: '15px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                  <span>Total</span>
                  <span>{formatCurrency(summary.total)}</span>
                </div>
              </div>
              
              {summary.subtotal < 100 && (
                <div className="alert alert-info" style={{ fontSize: '14px', margin: '15px 0' }}>
                  💡 Add {formatCurrency(100 - summary.subtotal)} more for free shipping!
                </div>
              )}
              
              <button
                onClick={handleCheckout}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '20px' }}
              >
                {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link 
                  to="/products"
                  style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
          
          {/* Security Badge */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔒</div>
              <h4 style={{ fontSize: '16px', marginBottom: '5px' }}>Secure Checkout</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                Your payment information is encrypted and secure with Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
