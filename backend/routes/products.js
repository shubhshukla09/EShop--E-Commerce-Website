const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for product creation/update
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom(value => value >= 0)
    .withMessage('Price cannot be negative'),
  body('category')
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Health & Beauty', 'Automotive', 'Food & Beverages', 'Other'])
    .withMessage('Invalid category'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  body('images.*.url')
    .isURL()
    .withMessage('Each image must have a valid URL')
];

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
  query('search').optional().trim(),
  query('sort').optional().isIn(['price', '-price', 'name', '-name', 'createdAt', '-createdAt', 'ratings', '-ratings'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true, stock: { $gt: 0 } };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default sort by newest
    if (req.query.sort) {
      const sortField = req.query.sort.replace('-', '');
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      
      if (sortField === 'ratings') {
        sortOption = { 'ratings.average': sortOrder };
      } else {
        sortOption = { [sortField]: sortOrder };
      }
    }

    // Add text search score to sort if searching
    if (req.query.search) {
      sortOption = { score: { $meta: 'textScore' }, ...sortOption };
    }

    // Execute optimized query with aggregation pipeline
    const aggregationPipeline = [
      { $match: query },
      { $sort: sortOption },
      {
        $facet: {
          products: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                name: 1,
                description: 1,
                price: 1,
                originalPrice: 1,
                category: 1,
                brand: 1,
                images: { $slice: ['$images', 3] }, // Limit images for performance
                stock: 1,
                sold: 1,
                ratings: 1,
                discount: 1,
                isFeatured: 1,
                createdAt: 1,
                discountedPrice: {
                  $cond: {
                    if: { $gt: ['$discount', 0] },
                    then: { $multiply: ['$price', { $subtract: [1, { $divide: ['$discount', 100] }] }] },
                    else: '$price'
                  }
                }
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Product.aggregate(aggregationPipeline);
    const products = result[0].products;
    const totalProducts = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      message: 'Products retrieved successfully',
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      message: 'Failed to retrieve products',
      code: 'PRODUCTS_FETCH_FAILED'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const products = await Product.findFeatured(limit);

    res.json({
      message: 'Featured products retrieved successfully',
      products
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      message: 'Failed to retrieve featured products',
      code: 'FEATURED_PRODUCTS_FAILED'
    });
  }
});

// @route   GET /api/products/categories
// @desc    Get all product categories with counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      message: 'Categories retrieved successfully',
      categories: categories.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Failed to retrieve categories',
      code: 'CATEGORIES_FAILED'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        message: 'Product not available',
        code: 'PRODUCT_NOT_AVAILABLE'
      });
    }

    res.json({
      message: 'Product retrieved successfully',
      product
    });

  } catch (error) {
    console.error('Get product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID',
        code: 'INVALID_PRODUCT_ID'
      });
    }
    
    res.status(500).json({
      message: 'Failed to retrieve product',
      code: 'PRODUCT_FETCH_FAILED'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private/Admin
router.post('/', authenticateToken, requireAdmin, productValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({ msg: err.message, path: err.path })),
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      message: 'Failed to create product',
      code: 'PRODUCT_CREATE_FAILED'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, requireAdmin, productValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID',
        code: 'INVALID_PRODUCT_ID'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({ msg: err.message, path: err.path })),
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      message: 'Failed to update product',
      code: 'PRODUCT_UPDATE_FAILED'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID',
        code: 'INVALID_PRODUCT_ID'
      });
    }
    
    res.status(500).json({
      message: 'Failed to delete product',
      code: 'PRODUCT_DELETE_FAILED'
    });
  }
});

// @route   GET /api/products/category/:category
// @desc    Get products by category with optimized query
// @access  Public
router.get('/category/:category', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sort').optional().isIn(['price', '-price', 'name', '-name', 'ratings', '-ratings'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Sort options
    let sortOption = { createdAt: -1 };
    if (req.query.sort) {
      const sortField = req.query.sort.replace('-', '');
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      
      if (sortField === 'ratings') {
        sortOption = { 'ratings.average': sortOrder };
      } else {
        sortOption = { [sortField]: sortOrder };
      }
    }

    // Use optimized static method
    const products = await Product.findByCategory(req.params.category, {
      limit,
      skip,
      sort: sortOption
    });

    // Get total count for pagination
    const totalProducts = await Product.countDocuments({
      category: req.params.category,
      isActive: true,
      stock: { $gt: 0 }
    });

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      message: `Products in ${req.params.category} retrieved successfully`,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      message: 'Failed to retrieve products',
      code: 'CATEGORY_PRODUCTS_FAILED'
    });
  }
});

module.exports = router;
