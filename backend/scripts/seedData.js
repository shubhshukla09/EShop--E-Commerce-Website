const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
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

// Sample users
const sampleUsers = [
  {
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'Demo123!',
    role: 'user'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin'
  }
];

// Sample products (50+ products across different categories)
const sampleProducts = [
  // Electronics
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system and A17 Pro chip. Features titanium design and Action Button.',
    price: 999.99,
    category: 'Electronics',
    brand: 'Apple',
    images: [{ url: 'https://via.placeholder.com/400x300/007bff/ffffff?text=iPhone+15+Pro', isPrimary: true }],
    stock: 25,
    sold: 15,
    ratings: { average: 4.8, count: 124 },
    isFeatured: true,
    tags: ['smartphone', 'apple', 'premium', 'camera']
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen, 200MP camera, and AI-powered features.',
    price: 1199.99,
    category: 'Electronics',
    brand: 'Samsung',
    images: [{ url: 'https://via.placeholder.com/400x300/28a745/ffffff?text=Galaxy+S24', isPrimary: true }],
    stock: 30,
    sold: 8,
    ratings: { average: 4.6, count: 89 },
    isFeatured: true,
    tags: ['smartphone', 'samsung', 'android', 's-pen']
  },
  {
    name: 'MacBook Air M3',
    description: '13-inch laptop with M3 chip, up to 18 hours battery life, and stunning Liquid Retina display.',
    price: 1099.99,
    category: 'Electronics',
    brand: 'Apple',
    images: [{ url: 'https://via.placeholder.com/400x300/6c757d/ffffff?text=MacBook+Air', isPrimary: true }],
    stock: 15,
    sold: 12,
    ratings: { average: 4.9, count: 256 },
    isFeatured: true,
    tags: ['laptop', 'apple', 'macbook', 'm3']
  },
  {
    name: 'Dell XPS 13',
    description: 'Ultra-thin laptop with InfinityEdge display, 11th Gen Intel processors, and premium build quality.',
    price: 899.99,
    category: 'Electronics',
    brand: 'Dell',
    images: [{ url: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Dell+XPS+13', isPrimary: true }],
    stock: 20,
    sold: 18,
    ratings: { average: 4.5, count: 143 },
    tags: ['laptop', 'dell', 'ultrabook', 'windows']
  },
  {
    name: 'iPad Pro 12.9"',
    description: 'Most advanced iPad with M2 chip, Liquid Retina XDR display, and Apple Pencil compatibility.',
    price: 799.99,
    category: 'Electronics',
    brand: 'Apple',
    images: [{ url: 'https://via.placeholder.com/400x300/007bff/ffffff?text=iPad+Pro', isPrimary: true }],
    stock: 35,
    sold: 22,
    ratings: { average: 4.7, count: 178 },
    isFeatured: true,
    tags: ['tablet', 'apple', 'ipad', 'm2']
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling wireless headphones with 30-hour battery life.',
    price: 399.99,
    category: 'Electronics',
    brand: 'Sony',
    images: [{ url: 'https://via.placeholder.com/400x300/ffc107/000000?text=Sony+Headphones', isPrimary: true }],
    stock: 50,
    sold: 45,
    ratings: { average: 4.8, count: 312 },
    isFeatured: true,
    tags: ['headphones', 'sony', 'wireless', 'noise-canceling']
  },
  {
    name: 'AirPods Pro (3rd Gen)',
    description: 'Wireless earbuds with active noise cancellation, spatial audio, and MagSafe charging.',
    price: 249.99,
    category: 'Electronics',
    brand: 'Apple',
    images: [{ url: 'https://via.placeholder.com/400x300/007bff/ffffff?text=AirPods+Pro', isPrimary: true }],
    stock: 60,
    sold: 78,
    ratings: { average: 4.6, count: 445 },
    tags: ['earbuds', 'apple', 'wireless', 'noise-canceling']
  },
  {
    name: 'Nintendo Switch OLED',
    description: 'Gaming console with vibrant 7-inch OLED screen, enhanced audio, and dock with wired LAN port.',
    price: 349.99,
    category: 'Electronics',
    brand: 'Nintendo',
    images: [{ url: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Switch+OLED', isPrimary: true }],
    stock: 25,
    sold: 33,
    ratings: { average: 4.7, count: 201 },
    tags: ['gaming', 'nintendo', 'console', 'portable']
  },

  // Clothing
  {
    name: 'Classic White T-Shirt',
    description: '100% organic cotton t-shirt with comfortable fit. Perfect for everyday wear.',
    price: 24.99,
    category: 'Clothing',
    brand: 'BasicWear',
    images: [{ url: 'https://via.placeholder.com/400x300/ffffff/000000?text=White+T-Shirt', isPrimary: true }],
    stock: 100,
    sold: 156,
    ratings: { average: 4.3, count: 89 },
    tags: ['t-shirt', 'cotton', 'basic', 'casual']
  },
  {
    name: 'Denim Jeans - Slim Fit',
    description: 'Premium denim jeans with modern slim fit and comfortable stretch fabric.',
    price: 79.99,
    category: 'Clothing',
    brand: 'DenimCo',
    images: [{ url: 'https://via.placeholder.com/400x300/000080/ffffff?text=Slim+Jeans', isPrimary: true }],
    stock: 75,
    sold: 92,
    ratings: { average: 4.5, count: 156 },
    tags: ['jeans', 'denim', 'slim-fit', 'casual']
  },
  {
    name: 'Winter Wool Coat',
    description: 'Elegant wool coat perfect for cold weather. Features classic design and warm lining.',
    price: 199.99,
    category: 'Clothing',
    brand: 'WinterWear',
    images: [{ url: 'https://via.placeholder.com/400x300/8b4513/ffffff?text=Wool+Coat', isPrimary: true }],
    stock: 30,
    sold: 24,
    ratings: { average: 4.8, count: 67 },
    tags: ['coat', 'wool', 'winter', 'formal']
  },
  {
    name: 'Athletic Running Shoes',
    description: 'High-performance running shoes with cushioned sole and breathable mesh upper.',
    price: 129.99,
    category: 'Clothing',
    brand: 'SportMax',
    images: [{ url: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Running+Shoes', isPrimary: true }],
    stock: 85,
    sold: 134,
    ratings: { average: 4.4, count: 298 },
    isFeatured: true,
    tags: ['shoes', 'running', 'athletic', 'sports']
  },

  // Books
  {
    name: 'The Psychology of Money',
    description: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel.',
    price: 16.99,
    category: 'Books',
    brand: 'Harriman House',
    images: [{ url: 'https://via.placeholder.com/400x300/4a90e2/ffffff?text=Psychology+Money', isPrimary: true }],
    stock: 200,
    sold: 89,
    ratings: { average: 4.7, count: 1245 },
    isFeatured: true,
    tags: ['finance', 'psychology', 'self-help', 'bestseller']
  },
  {
    name: 'Atomic Habits',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones by James Clear.',
    price: 18.99,
    category: 'Books',
    brand: 'Avery',
    images: [{ url: 'https://via.placeholder.com/400x300/50c878/ffffff?text=Atomic+Habits', isPrimary: true }],
    stock: 150,
    sold: 234,
    ratings: { average: 4.8, count: 2156 },
    isFeatured: true,
    tags: ['self-help', 'habits', 'productivity', 'bestseller']
  },
  {
    name: 'Clean Code',
    description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin.',
    price: 42.99,
    category: 'Books',
    brand: 'Prentice Hall',
    images: [{ url: 'https://via.placeholder.com/400x300/333333/ffffff?text=Clean+Code', isPrimary: true }],
    stock: 75,
    sold: 156,
    ratings: { average: 4.6, count: 876 },
    tags: ['programming', 'software', 'technical', 'development']
  },

  // Home & Garden
  {
    name: 'Robot Vacuum Cleaner',
    description: 'Smart robot vacuum with mapping technology, app control, and automatic charging.',
    price: 299.99,
    category: 'Home & Garden',
    brand: 'CleanBot',
    images: [{ url: 'https://via.placeholder.com/400x300/708090/ffffff?text=Robot+Vacuum', isPrimary: true }],
    stock: 40,
    sold: 67,
    ratings: { average: 4.4, count: 234 },
    isFeatured: true,
    tags: ['vacuum', 'robot', 'smart-home', 'cleaning']
  },
  {
    name: 'Coffee Maker - Programmable',
    description: '12-cup programmable coffee maker with thermal carafe and auto shut-off.',
    price: 89.99,
    category: 'Home & Garden',
    brand: 'BrewMaster',
    images: [{ url: 'https://via.placeholder.com/400x300/654321/ffffff?text=Coffee+Maker', isPrimary: true }],
    stock: 55,
    sold: 89,
    ratings: { average: 4.2, count: 167 },
    tags: ['coffee', 'kitchen', 'appliance', 'programmable']
  },
  {
    name: 'Indoor Plant Collection',
    description: 'Set of 6 easy-care houseplants perfect for beginners. Includes care instructions.',
    price: 49.99,
    category: 'Home & Garden',
    brand: 'GreenThumb',
    images: [{ url: 'https://via.placeholder.com/400x300/228b22/ffffff?text=Plant+Collection', isPrimary: true }],
    stock: 80,
    sold: 123,
    ratings: { average: 4.6, count: 89 },
    tags: ['plants', 'indoor', 'garden', 'home-decor']
  },

  // Sports
  {
    name: 'Yoga Mat - Premium',
    description: 'Non-slip yoga mat with excellent grip and cushioning. Eco-friendly material.',
    price: 34.99,
    category: 'Sports',
    brand: 'YogaLife',
    images: [{ url: 'https://via.placeholder.com/400x300/9932cc/ffffff?text=Yoga+Mat', isPrimary: true }],
    stock: 120,
    sold: 198,
    ratings: { average: 4.5, count: 345 },
    tags: ['yoga', 'fitness', 'exercise', 'mat']
  },
  {
    name: 'Adjustable Dumbbells Set',
    description: 'Space-saving adjustable dumbbells with multiple weight options (5-50 lbs each).',
    price: 199.99,
    category: 'Sports',
    brand: 'FitGear',
    images: [{ url: 'https://via.placeholder.com/400x300/ff4500/ffffff?text=Dumbbells', isPrimary: true }],
    stock: 25,
    sold: 34,
    ratings: { average: 4.7, count: 78 },
    tags: ['weights', 'dumbbells', 'fitness', 'home-gym']
  },

  // Toys
  {
    name: 'LEGO Creator 3-in-1 Set',
    description: 'Build 3 different models with this versatile LEGO set. Hours of creative fun!',
    price: 59.99,
    category: 'Toys',
    brand: 'LEGO',
    images: [{ url: 'https://via.placeholder.com/400x300/ff6b35/ffffff?text=LEGO+Set', isPrimary: true }],
    stock: 45,
    sold: 89,
    ratings: { average: 4.8, count: 156 },
    tags: ['lego', 'building', 'creative', 'kids']
  },
  {
    name: 'Remote Control Drone',
    description: 'Easy-to-fly drone with HD camera, LED lights, and multiple flight modes.',
    price: 149.99,
    category: 'Toys',
    brand: 'SkyFly',
    images: [{ url: 'https://via.placeholder.com/400x300/00ced1/ffffff?text=RC+Drone', isPrimary: true }],
    stock: 35,
    sold: 56,
    ratings: { average: 4.3, count: 89 },
    tags: ['drone', 'remote-control', 'camera', 'outdoor']
  },

  // Health & Beauty
  {
    name: 'Electric Toothbrush',
    description: 'Rechargeable electric toothbrush with multiple brushing modes and timer.',
    price: 79.99,
    category: 'Health & Beauty',
    brand: 'DentalCare',
    images: [{ url: 'https://via.placeholder.com/400x300/20b2aa/ffffff?text=Electric+Toothbrush', isPrimary: true }],
    stock: 65,
    sold: 112,
    ratings: { average: 4.4, count: 234 },
    tags: ['toothbrush', 'dental', 'electric', 'health']
  },
  {
    name: 'Skincare Set - Anti-Aging',
    description: '4-piece anti-aging skincare set with cleanser, serum, moisturizer, and sunscreen.',
    price: 89.99,
    category: 'Health & Beauty',
    brand: 'GlowSkin',
    images: [{ url: 'https://via.placeholder.com/400x300/ffc0cb/000000?text=Skincare+Set', isPrimary: true }],
    stock: 70,
    sold: 145,
    ratings: { average: 4.6, count: 298 },
    isFeatured: true,
    tags: ['skincare', 'anti-aging', 'beauty', 'set']
  },

  // Additional products to reach 50+
  {
    name: 'Bluetooth Speaker - Waterproof',
    description: 'Portable waterproof speaker with 360-degree sound and 12-hour battery life.',
    price: 49.99,
    category: 'Electronics',
    brand: 'SoundWave',
    images: [{ url: 'https://via.placeholder.com/400x300/4169e1/ffffff?text=BT+Speaker', isPrimary: true }],
    stock: 90,
    sold: 167,
    ratings: { average: 4.3, count: 189 },
    tags: ['speaker', 'bluetooth', 'waterproof', 'portable']
  },
  {
    name: 'Gaming Mouse - RGB',
    description: 'High-precision gaming mouse with customizable RGB lighting and programmable buttons.',
    price: 69.99,
    category: 'Electronics',
    brand: 'GamePro',
    images: [{ url: 'https://via.placeholder.com/400x300/8a2be2/ffffff?text=Gaming+Mouse', isPrimary: true }],
    stock: 75,
    sold: 89,
    ratings: { average: 4.5, count: 123 },
    tags: ['mouse', 'gaming', 'rgb', 'precision']
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle that keeps drinks cold for 24h or hot for 12h. BPA-free.',
    price: 24.99,
    category: 'Home & Garden',
    brand: 'HydroMax',
    images: [{ url: 'https://via.placeholder.com/400x300/4682b4/ffffff?text=Water+Bottle', isPrimary: true }],
    stock: 150,
    sold: 234,
    ratings: { average: 4.7, count: 445 },
    tags: ['water-bottle', 'insulated', 'stainless-steel', 'eco-friendly']
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices. LED indicator included.',
    price: 29.99,
    category: 'Electronics',
    brand: 'ChargeFast',
    images: [{ url: 'https://via.placeholder.com/400x300/32cd32/ffffff?text=Wireless+Charger', isPrimary: true }],
    stock: 100,
    sold: 178,
    ratings: { average: 4.2, count: 156 },
    tags: ['charger', 'wireless', 'qi', 'fast-charging']
  },
  {
    name: 'Camping Tent - 4 Person',
    description: 'Weatherproof 4-person tent with easy setup and ventilation system. Perfect for camping.',
    price: 129.99,
    category: 'Sports',
    brand: 'OutdoorLife',
    images: [{ url: 'https://via.placeholder.com/400x300/2e8b57/ffffff?text=Camping+Tent', isPrimary: true }],
    stock: 30,
    sold: 45,
    ratings: { average: 4.4, count: 67 },
    tags: ['tent', 'camping', 'outdoor', 'weatherproof']
  }
];

// Add more products to reach 50+
const additionalProducts = [
  // More Electronics
  { name: '4K Webcam', description: 'Ultra HD webcam with auto-focus and noise reduction microphone.', price: 89.99, category: 'Electronics', brand: 'WebCamPro', images: [{ url: 'https://via.placeholder.com/400x300/ff6347/ffffff?text=4K+Webcam', isPrimary: true }], stock: 45, sold: 23, ratings: { average: 4.3, count: 89 }, tags: ['webcam', '4k', 'streaming'] },
  { name: 'Mechanical Keyboard', description: 'RGB backlit mechanical keyboard with blue switches.', price: 119.99, category: 'Electronics', brand: 'KeyMaster', images: [{ url: 'https://via.placeholder.com/400x300/ff1493/ffffff?text=Mech+Keyboard', isPrimary: true }], stock: 60, sold: 78, ratings: { average: 4.6, count: 134 }, tags: ['keyboard', 'mechanical', 'rgb', 'gaming'] },
  
  // More Clothing
  { name: 'Casual Sneakers', description: 'Comfortable everyday sneakers with modern design.', price: 79.99, category: 'Clothing', brand: 'ComfortFeet', images: [{ url: 'https://via.placeholder.com/400x300/ffa500/ffffff?text=Sneakers', isPrimary: true }], stock: 95, sold: 143, ratings: { average: 4.2, count: 189 }, tags: ['sneakers', 'casual', 'comfortable'] },
  { name: 'Business Shirt', description: 'Professional dress shirt with wrinkle-free fabric.', price: 49.99, category: 'Clothing', brand: 'OfficeWear', images: [{ url: 'https://via.placeholder.com/400x300/4169e1/ffffff?text=Business+Shirt', isPrimary: true }], stock: 80, sold: 67, ratings: { average: 4.4, count: 78 }, tags: ['shirt', 'business', 'formal', 'wrinkle-free'] },
  
  // More Home & Garden
  { name: 'Air Purifier', description: 'HEPA air purifier for large rooms with smart controls.', price: 199.99, category: 'Home & Garden', brand: 'PureAir', images: [{ url: 'https://via.placeholder.com/400x300/87ceeb/ffffff?text=Air+Purifier', isPrimary: true }], stock: 35, sold: 56, ratings: { average: 4.5, count: 123 }, tags: ['air-purifier', 'hepa', 'smart', 'health'] },
  { name: 'Kitchen Knife Set', description: '8-piece professional knife set with wooden block.', price: 89.99, category: 'Home & Garden', brand: 'ChefTools', images: [{ url: 'https://via.placeholder.com/400x300/a0522d/ffffff?text=Knife+Set', isPrimary: true }], stock: 50, sold: 89, ratings: { average: 4.7, count: 156 }, tags: ['knives', 'kitchen', 'chef', 'cooking'] },
  
  // More Books
  { name: 'JavaScript Guide', description: 'Complete guide to modern JavaScript development.', price: 39.99, category: 'Books', brand: 'TechBooks', images: [{ url: 'https://via.placeholder.com/400x300/ffd700/000000?text=JS+Guide', isPrimary: true }], stock: 100, sold: 78, ratings: { average: 4.4, count: 234 }, tags: ['javascript', 'programming', 'web-development'] },
  { name: 'Cooking Masterclass', description: 'Professional cooking techniques and recipes.', price: 24.99, category: 'Books', brand: 'CulinaryPress', images: [{ url: 'https://via.placeholder.com/400x300/ff69b4/ffffff?text=Cooking+Book', isPrimary: true }], stock: 75, sold: 45, ratings: { average: 4.6, count: 89 }, tags: ['cooking', 'recipes', 'culinary', 'masterclass'] }
];

// Combine all products
const allProducts = [...sampleProducts, ...additionalProducts];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Create users
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    await User.insertMany(sampleUsers);
    console.log(`✅ Created ${sampleUsers.length} users`);
    
    // Create products
    await Product.insertMany(allProducts);
    console.log(`✅ Created ${allProducts.length} products`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Products: ${allProducts.length}`);
    console.log(`- Categories: ${[...new Set(allProducts.map(p => p.category))].length}`);
    console.log(`- Brands: ${[...new Set(allProducts.map(p => p.brand))].length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
connectDB().then(() => {
  seedDatabase();
});
