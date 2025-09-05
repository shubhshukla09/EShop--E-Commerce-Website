const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Real product images from free sources
const realImages = {
  'iPhone 15 Pro': 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
  'Samsung Galaxy S24 Ultra': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
  'MacBook Air M3': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
  'Dell XPS 13': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  'iPad Pro 12.9"': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
  'Sony WH-1000XM5': 'https://images.unsplash.com/photo-1583394838360-aafb857655b6?w=400',
  'AirPods Pro (3rd Gen)': 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
  'Nintendo Switch OLED': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
  'Classic White T-Shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  'Denim Jeans - Slim Fit': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
  'Winter Wool Coat': 'https://images.unsplash.com/photo-1551062404-6ba90cb38894?w=400',
  'Athletic Running Shoes': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  'The Psychology of Money': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
  'Atomic Habits': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
  'Clean Code': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
  'Robot Vacuum Cleaner': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
  'Coffee Maker - Programmable': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  'Indoor Plant Collection': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  'Yoga Mat - Premium': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
  'Adjustable Dumbbells Set': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  'LEGO Creator 3-in-1 Set': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
  'Remote Control Drone': 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400',
  'Electric Toothbrush': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400',
  'Skincare Set - Anti-Aging': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
  'Bluetooth Speaker - Waterproof': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
  'Gaming Mouse - RGB': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
  'Stainless Steel Water Bottle': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400',
  'Wireless Charging Pad': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
  'Camping Tent - 4 Person': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'
};

const updateProductImages = async () => {
  try {
    console.log('🖼️  Updating product images...');
    
    const products = await Product.find();
    let updatedCount = 0;
    
    for (const product of products) {
      const realImageUrl = realImages[product.name];
      
      if (realImageUrl) {
        product.images = [{ 
          url: realImageUrl, 
          isPrimary: true,
          alt: product.name 
        }];
        
        await product.save();
        updatedCount++;
        console.log(`✅ Updated image for: ${product.name}`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} product images!`);
    
  } catch (error) {
    console.error('❌ Error updating images:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the update
connectDB().then(() => {
  updateProductImages();
});
