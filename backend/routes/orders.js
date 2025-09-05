const express = require('express');
const { query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', 
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
  ],
  async (req, res) => {
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
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status;

      const orders = await Order.findUserOrders(req.user._id, {
        limit,
        skip,
        status
      });

      // Get total count for pagination
      const query = { user: req.user._id };
      if (status) query.status = status;
      
      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);

      res.json({
        message: 'Orders retrieved successfully',
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        message: 'Failed to retrieve orders',
        code: 'ORDERS_FETCH_FAILED'
      });
    }
  }
);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name price images category');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Check if order belongs to user or user is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Unauthorized to access this order',
        code: 'ORDER_ACCESS_DENIED'
      });
    }

    res.json({
      message: 'Order retrieved successfully',
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid order ID',
        code: 'INVALID_ORDER_ID'
      });
    }
    
    res.status(500).json({
      message: 'Failed to retrieve order',
      code: 'ORDER_FETCH_FAILED'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Unauthorized to cancel this order',
        code: 'ORDER_ACCESS_DENIED'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        message: 'Order cannot be cancelled',
        code: 'ORDER_CANNOT_BE_CANCELLED'
      });
    }

    if (order.status === 'shipped') {
      return res.status(400).json({
        message: 'Order has already shipped and cannot be cancelled',
        code: 'ORDER_ALREADY_SHIPPED'
      });
    }

    // Cancel the order
    order.status = 'cancelled';
    await order.save();

    // If order was paid, you would typically initiate a refund here
    // For this demo, we'll just update the status

    res.json({
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid order ID',
        code: 'INVALID_ORDER_ID'
      });
    }
    
    res.status(500).json({
      message: 'Failed to cancel order',
      code: 'ORDER_CANCEL_FAILED'
    });
  }
});

// Admin routes
// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    query('sortBy').optional().isIn(['createdAt', 'totalPrice', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  async (req, res) => {
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
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build query
      let query = {};
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Build sort options
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sortOptions = { [sortBy]: sortOrder };

      // Get orders with user information
      const orders = await Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name price images')
        .sort(sortOptions)
        .limit(limit)
        .skip(skip)
        .select('-__v');

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);

      // Calculate statistics
      const stats = await Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            averageOrderValue: { $avg: '$totalPrice' },
            totalOrders: { $sum: 1 }
          }
        }
      ]);

      res.json({
        message: 'Orders retrieved successfully',
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        statistics: stats[0] || {
          totalRevenue: 0,
          averageOrderValue: 0,
          totalOrders: 0
        }
      });

    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({
        message: 'Failed to retrieve orders',
        code: 'ADMIN_ORDERS_FETCH_FAILED'
      });
    }
  }
);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, trackingNumber } = req.body;

      if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({
          message: 'Valid status is required',
          code: 'INVALID_STATUS'
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Update order status
      order.status = status;
      
      if (status === 'shipped' && trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }

      await order.save();

      res.json({
        message: 'Order status updated successfully',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingNumber: order.trackingNumber,
          isDelivered: order.isDelivered,
          deliveredAt: order.deliveredAt
        }
      });

    } catch (error) {
      console.error('Update order status error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          message: 'Invalid order ID',
          code: 'INVALID_ORDER_ID'
        });
      }
      
      res.status(500).json({
        message: 'Failed to update order status',
        code: 'ORDER_STATUS_UPDATE_FAILED'
      });
    }
  }
);

// @route   GET /api/orders/admin/stats
// @desc    Get order statistics (Admin only)
// @access  Private/Admin
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalPrice status createdAt user');

    const monthlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      message: 'Order statistics retrieved successfully',
      statusStats: stats,
      recentOrders,
      monthlyStats
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve order statistics',
      code: 'ORDER_STATS_FAILED'
    });
  }
});

module.exports = router;
