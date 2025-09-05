const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for Stripe
// @access  Private
router.post('/create-payment-intent', 
  authenticateToken,
  [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items array is required'),
    body('items.*.productId')
      .notEmpty()
      .withMessage('Product ID is required'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('shippingAddress')
      .notEmpty()
      .withMessage('Shipping address is required'),
    body('shippingAddress.name')
      .trim()
      .notEmpty()
      .withMessage('Recipient name is required'),
    body('shippingAddress.street')
      .trim()
      .notEmpty()
      .withMessage('Street address is required'),
    body('shippingAddress.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    body('shippingAddress.state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    body('shippingAddress.zipCode')
      .trim()
      .notEmpty()
      .withMessage('ZIP code is required'),
    body('shippingAddress.country')
      .trim()
      .notEmpty()
      .withMessage('Country is required')
  ],
  async (req, res) => {
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

      const { items, shippingAddress } = req.body;

      // Validate products and calculate total
      let itemsPrice = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          return res.status(404).json({
            message: `Product with ID ${item.productId} not found`,
            code: 'PRODUCT_NOT_FOUND'
          });
        }

        if (!product.isActive || product.stock < item.quantity) {
          return res.status(400).json({
            message: `Product "${product.name}" is not available in the requested quantity`,
            code: 'INSUFFICIENT_STOCK'
          });
        }

        const itemTotal = product.price * item.quantity;
        itemsPrice += itemTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.images[0]?.url || ''
        });
      }

      // Calculate additional costs
      const taxRate = 0.08; // 8% tax
      const taxPrice = Math.round(itemsPrice * taxRate * 100) / 100;
      const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over $100
      const totalPrice = Math.round((itemsPrice + taxPrice + shippingPrice) * 100) / 100;

      // Create order in database
      const order = new Order({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
      });

      await order.save();

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString()
        },
        description: `Order ${order.orderNumber} - ${orderItems.length} items`
      });

      // Update order with Stripe payment intent ID
      order.stripePaymentIntentId = paymentIntent.id;
      await order.save();

      res.json({
        message: 'Payment intent created successfully',
        clientSecret: paymentIntent.client_secret,
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: totalPrice
      });

    } catch (error) {
      console.error('Create payment intent error:', error);
      
      if (error.type === 'StripeCardError') {
        return res.status(400).json({
          message: 'Card error',
          error: error.message,
          code: 'STRIPE_CARD_ERROR'
        });
      }
      
      res.status(500).json({
        message: 'Failed to create payment intent',
        code: 'PAYMENT_INTENT_FAILED'
      });
    }
  }
);

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update order status
// @access  Private
router.post('/confirm-payment',
  authenticateToken,
  [
    body('paymentIntentId')
      .notEmpty()
      .withMessage('Payment intent ID is required'),
    body('orderId')
      .notEmpty()
      .withMessage('Order ID is required')
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

      const { paymentIntentId, orderId } = req.body;

      // Find order
      const order = await Order.findById(orderId).populate('items.product');
      
      if (!order) {
        return res.status(404).json({
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Verify order belongs to user
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Unauthorized to access this order',
          code: 'ORDER_ACCESS_DENIED'
        });
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update order status
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'processing';
        order.paymentResult = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString()
        };

        await order.save();

        // Update product stock and sold count
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock -= item.quantity;
            product.sold += item.quantity;
            await product.save();
          }
        }

        res.json({
          message: 'Payment confirmed successfully',
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            isPaid: order.isPaid,
            paidAt: order.paidAt,
            totalPrice: order.totalPrice
          }
        });

      } else {
        res.status(400).json({
          message: 'Payment not successful',
          status: paymentIntent.status,
          code: 'PAYMENT_NOT_SUCCESSFUL'
        });
      }

    } catch (error) {
      console.error('Confirm payment error:', error);
      
      if (error.type && error.type.startsWith('Stripe')) {
        return res.status(400).json({
          message: 'Payment processing error',
          error: error.message,
          code: 'STRIPE_ERROR'
        });
      }
      
      res.status(500).json({
        message: 'Failed to confirm payment',
        code: 'PAYMENT_CONFIRMATION_FAILED'
      });
    }
  }
);

// @route   POST /api/payments/webhook
// @desc    Stripe webhook endpoint
// @access  Public (but verified with Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`Payment ${paymentIntent.id} succeeded`);
      
      // Find and update order
      const order = await Order.findOne({ 
        stripePaymentIntentId: paymentIntent.id 
      });
      
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'processing';
        order.paymentResult = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          update_time: new Date().toISOString()
        };
        await order.save();

        // Update product stock
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock -= item.quantity;
            product.sold += item.quantity;
            await product.save();
          }
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`Payment ${failedPayment.id} failed`);
      
      // Find and update order
      const failedOrder = await Order.findOne({ 
        stripePaymentIntentId: failedPayment.id 
      });
      
      if (failedOrder) {
        failedOrder.status = 'cancelled';
        await failedOrder.save();
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @route   GET /api/payments/config
// @desc    Get Stripe publishable key
// @access  Private
router.get('/config', authenticateToken, (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

module.exports = router;
