import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsAPI, formatCurrency, handleApiError } from '../utils/api';
import { useCart } from '../context/CartContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'createdAt',
    page: parseInt(searchParams.get('page')) || 1
  });
  
  const { addToCart } = useCart();

  // Load products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = {};
        Object.keys(filters).forEach(key => {
          if (filters[key]) {
            params[key] = filters[key];
          }
        });
        
        const [productsRes, categoriesRes] = await Promise.all([
          productsAPI.getAll(params),
          productsAPI.getCategories()
        ]);
        
        setProducts(productsRes.data.products);
        setPagination(productsRes.data.pagination);
        setCategories(categoriesRes.data.categories);
        setError(null);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.set(key, filters[key]);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const handleAddToCart = (product) => {
    try {
      addToCart(product);
      // Could add toast notification here
    } catch (err) {
      alert(err.message);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'createdAt',
      page: 1
    });
  };

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '50px' }}>
        <div className="alert alert-error">
          <h3>Error Loading Products</h3>
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
    <div className="container" style={{ paddingTop: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Products</h1>
        <p style={{ color: '#666' }}>
          {pagination.totalProducts ? `Showing ${pagination.totalProducts} products` : 'Loading products...'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Filters</h3>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={clearFilters}
                >
                  Clear All
                </button>
              </div>
              
              {/* Search */}
              <div className="form-group">
                <label className="form-label">Search Products</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              {/* Category Filter */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Price Range */}
              <div className="form-group">
                <label className="form-label">Price Range</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Min $"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Max $"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Sort */}
              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select
                  className="form-control"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="createdAt">Newest First</option>
                  <option value="-createdAt">Oldest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="-name">Name: Z to A</option>
                  <option value="-ratings">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-content">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h3>No Products Found</h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Try adjusting your filters or search terms.
                </p>
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map(product => (
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
                      <p className="card-text" style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical',
                        fontSize: '14px'
                      }}>
                        {product.description}
                      </p>
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
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock <= 0}
                          style={{ flex: 1 }}
                        >
                          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <Link 
                          to={`/products/${product._id}`}
                          className="btn btn-outline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '50px'
                }}>
                  <button
                    className="btn btn-outline"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                  >
                    Previous
                  </button>
                  
                  <span style={{ margin: '0 20px' }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    className="btn btn-outline"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
