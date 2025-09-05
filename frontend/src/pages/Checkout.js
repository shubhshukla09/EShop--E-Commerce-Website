import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI, formatCurrency, handleApiError } from '../utils/api';

const Checkout = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getCartSummary, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'United States',
    phone: user?.phone || ''
  });
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  
  const summary = getCartSummary();

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const orderItems = items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }));
        
        const response = await paymentsAPI.createPaymentIntent({
          items: orderItems,
          shippingAddress
        });
        
        setClientSecret(response.data.clientSecret);
        setOrderId(response.data.orderId);
      } catch (err) {
        setPaymentError(handleApiError(err));
      }
    };

    if (items.length > 0 && shippingAddress.name && shippingAddress.street) {
      createPaymentIntent();
    }
  }, [items, shippingAddress]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
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
    
    if (!shippingAddress.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!shippingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!shippingAddress.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!shippingAddress.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    if (!shippingAddress.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    setPaymentError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: shippingAddress.name,
            email: user.email,
            address: {
              line1: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: 'US'
            }
          }
        }
      });
      
      if (error) {
        setPaymentError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        await paymentsAPI.confirmPayment(paymentIntent.id, orderId);
        
        // Clear cart and redirect to success page
        clearCart();
        navigate(`/order-success/${orderId}`);
      }
    } catch (err) {
      setPaymentError(handleApiError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container" style={{ paddingTop: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Checkout</h1>
        <p style={{ color: '#666' }}>
          Complete your order securely with Stripe
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        {/* Checkout Form */}
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            {/* Shipping Address */}
            <div className="card" style={{ marginBottom: '30px' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '20px' }}>Shipping Address</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={shippingAddress.name}
                      onChange={handleAddressChange}
                      className={`form-control ${errors.name ? 'error' : ''}`}
                      disabled={isProcessing}
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleAddressChange}
                      className="form-control"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    className={`form-control ${errors.street ? 'error' : ''}`}
                    disabled={isProcessing}
                  />
                  {errors.street && <div className="form-error">{errors.street}</div>}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      className={`form-control ${errors.city ? 'error' : ''}`}
                      disabled={isProcessing}
                    />
                    {errors.city && <div className="form-error">{errors.city}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      className={`form-control ${errors.state ? 'error' : ''}`}
                      disabled={isProcessing}
                    />
                    {errors.state && <div className="form-error">{errors.state}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleAddressChange}
                      className={`form-control ${errors.zipCode ? 'error' : ''}`}
                      disabled={isProcessing}
                    />
                    {errors.zipCode && <div className="form-error">{errors.zipCode}</div>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    className={`form-control ${errors.country ? 'error' : ''}`}
                    disabled={isProcessing}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                  {errors.country && <div className="form-error">{errors.country}</div>}
                </div>
              </div>
            </div>
            
            {/* Payment Information */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ marginBottom: '20px' }}>Payment Information</h3>
                
                <div className="form-group">
                  <label className="form-label">Card Details</label>
                  <div style={{ 
                    padding: '12px 15px', 
                    border: '2px solid #e0e0e0',
                    borderRadius: '5px',
                    backgroundColor: 'white'
                  }}>
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                
                {paymentError && (
                  <div className="alert alert-error" style={{ marginTop: '15px' }}>
                    {paymentError}
                  </div>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '30px' }}
                  disabled={!stripe || isProcessing || !clientSecret}
                >
                  {isProcessing ? 'Processing...' : `Pay ${formatCurrency(summary.total)}`}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    🔒 Your payment is secured by Stripe
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
              
              {/* Order Items */}
              <div style={{ marginBottom: '20px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.name}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Subtotal</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
