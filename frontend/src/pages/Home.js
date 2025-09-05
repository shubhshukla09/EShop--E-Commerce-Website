import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, formatCurrency, handleApiError } from '../utils/api';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuredRes, categoriesRes] = await Promise.all([
          productsAPI.getFeatured(8),
          productsAPI.getCategories()
        ]);
        
        setFeaturedProducts(featuredRes.data.products);
        setCategories(categoriesRes.data.categories);
        setError(null);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      addToCart(product);
      // You could add a toast notification here
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '50px' }}>
        <div className="alert alert-error">
          <h3>Error Loading Home Page</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero" style={{
        background: 'linear-gradient(135deg, #007bff, #0056b3)',
        color: 'white',
        padding: '100px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: 'bold' }}>
            Welcome to E-Shop
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
            Discover amazing products with secure payments and fast delivery
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Now
            </Link>
            <Link to="/products" className="btn btn-outline btn-lg" style={{ 
              borderColor: 'white', 
              color: 'white',
              backgroundColor: 'transparent'
            }}>
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" style={{ padding: '80px 0', backgroundColor: 'white' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '40px',
            textAlign: 'center'
          }}>
            <div className="feature-card">
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
              <h3>Secure Payments</h3>
              <p>Your payments are protected with industry-leading encryption and Stripe security.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚚</div>
              <h3>Fast Delivery</h3>
              <p>Free shipping on orders over $100. Get your products delivered quickly and safely.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⭐</div>
              <h3>Quality Products</h3>
              <p>We carefully curate our selection to bring you only the best products at great prices.</p>
            </div>
            <div className="feature-card">
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎧</div>
              <h3>24/7 Support</h3>
              <p>Our customer service team is always ready to help you with any questions or concerns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="categories" style={{ padding: '80px 0', backgroundColor: '#f8f9fa' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>
              Shop by Category
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '30px'
            }}>
              {categories.slice(0, 6).map((category) => (
                <Link 
                  key={category.name} 
                  to={`/products?category=${category.name}`}
                  className="card category-card"
                  style={{ 
                    textDecoration: 'none',
                    textAlign: 'center',
                    padding: '30px 20px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <h4>{category.name}</h4>
                  <p style={{ color: '#666', margin: '10px 0 0' }}>
                    {category.count} products
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="featured-products" style={{ padding: '80px 0' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>
              Featured Products
            </h2>
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <div key={product._id} className="product-card">
                  <Link to={`/products/${product._id}`}>
                    <img 
                      src={product.images?.[0]?.url || '/placeholder-image.jpg'} 
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </Link>
                  <div className="product-info">
                    <Link 
                      to={`/products/${product._id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <h3 className="product-name">{product.name}</h3>
                    </Link>
                    <div className="product-price">
                      {product.discount > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '10px' }}>
                            {formatCurrency(product.price)}
                          </span>
                          <span>{formatCurrency(product.discountedPrice)}</span>
                        </>
                      ) : (
                        <span>{formatCurrency(product.price)}</span>
                      )}
                    </div>
                    <div className="product-rating">
                      <div className="stars">
                        {'★'.repeat(Math.floor(product.ratings?.average || 0))}
                        {'☆'.repeat(5 - Math.floor(product.ratings?.average || 0))}
                      </div>
                      <span className="rating-text">
                        ({product.ratings?.count || 0} reviews)
                      </span>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      style={{ width: '100%' }}
                    >
                      {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <Link to="/products" className="btn btn-outline btn-lg">
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
