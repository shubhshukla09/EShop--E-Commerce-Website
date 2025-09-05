import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (cartItems) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

// Initial State
const initialState = {
  items: loadCartFromStorage(),
  totalItems: 0,
  totalAmount: 0,
  isLoading: false
};

// Calculate totals
const calculateTotals = (items) => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  return { totalItems, totalAmount };
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.LOAD_CART: {
      const items = action.payload;
      const { totalItems, totalAmount } = calculateTotals(items);
      
      return {
        ...state,
        items,
        totalItems,
        totalAmount
      };
    }
    
    case CART_ACTIONS.ADD_TO_CART: {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.id === product._id);
      
      let newItems;
      if (existingItem) {
        // Update quantity if item already exists
        newItems = state.items.map(item =>
          item.id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const newItem = {
          id: product._id,
          name: product.name,
          price: product.discountedPrice || product.price,
          image: product.images?.[0]?.url || product.primaryImage?.url || '',
          category: product.category,
          stock: product.stock,
          quantity
        };
        newItems = [...state.items, newItem];
      }
      
      const { totalItems, totalAmount } = calculateTotals(newItems);
      saveCartToStorage(newItems);
      
      return {
        ...state,
        items: newItems,
        totalItems,
        totalAmount
      };
    }
    
    case CART_ACTIONS.REMOVE_FROM_CART: {
      const productId = action.payload;
      const newItems = state.items.filter(item => item.id !== productId);
      const { totalItems, totalAmount } = calculateTotals(newItems);
      saveCartToStorage(newItems);
      
      return {
        ...state,
        items: newItems,
        totalItems,
        totalAmount
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return cartReducer(state, {
          type: CART_ACTIONS.REMOVE_FROM_CART,
          payload: productId
        });
      }
      
      const newItems = state.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      );
      
      const { totalItems, totalAmount } = calculateTotals(newItems);
      saveCartToStorage(newItems);
      
      return {
        ...state,
        items: newItems,
        totalItems,
        totalAmount
      };
    }
    
    case CART_ACTIONS.CLEAR_CART: {
      saveCartToStorage([]);
      
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalAmount: 0
      };
    }
    
    default:
      return state;
  }
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Initialize cart totals on mount
  useEffect(() => {
    const items = loadCartFromStorage();
    dispatch({
      type: CART_ACTIONS.LOAD_CART,
      payload: items
    });
  }, []);

  // Add to Cart Function
  const addToCart = (product, quantity = 1) => {
    // Check if product is in stock
    if (product.stock <= 0) {
      throw new Error('Product is out of stock');
    }
    
    // Check if adding this quantity would exceed stock
    const existingItem = state.items.find(item => item.id === product._id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantity + quantity > product.stock) {
      throw new Error(`Cannot add ${quantity} items. Only ${product.stock - currentQuantity} remaining in stock.`);
    }
    
    dispatch({
      type: CART_ACTIONS.ADD_TO_CART,
      payload: { product, quantity }
    });
  };

  // Remove from Cart Function
  const removeFromCart = (productId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_FROM_CART,
      payload: productId
    });
  };

  // Update Quantity Function
  const updateQuantity = (productId, quantity) => {
    // Find the item in cart to check stock
    const cartItem = state.items.find(item => item.id === productId);
    
    if (cartItem && quantity > cartItem.stock) {
      throw new Error(`Cannot update quantity. Only ${cartItem.stock} items available in stock.`);
    }
    
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { productId, quantity }
    });
  };

  // Clear Cart Function
  const clearCart = () => {
    dispatch({
      type: CART_ACTIONS.CLEAR_CART
    });
  };

  // Get Item Quantity Function
  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Check if Item is in Cart
  const isInCart = (productId) => {
    return state.items.some(item => item.id === productId);
  };

  // Get Cart Summary
  const getCartSummary = () => {
    const subtotal = state.totalAmount;
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: state.totalItems
    };
  };

  // Context Value
  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    getCartSummary
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook to use Cart Context
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

export default CartContext;
