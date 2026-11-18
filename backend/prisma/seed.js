require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  { name: 'Living Room', slug: 'living-room' },
  { name: 'Bedroom', slug: 'bedroom' },
  { name: 'Dining Room', slug: 'dining-room' },
  { name: 'Office', slug: 'office' },
  { name: 'Outdoor', slug: 'outdoor' }
];

const products = [
  {
    code: 'FH001',
    name: 'Modern 5-Seater Sofa',
    category: 'Living Room',
    price: 45000,
    originalPrice: 52000,
    rating: 4.9,
    stock: 8,
    color: 'Ash Grey',
    material: 'Corduroy',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'A plush, contemporary sofa with deep seats and durable upholstery designed for cozy family evenings.',
    tags: 'Featured',
    newArrival: true,
    featured: true
  },
  {
    code: 'FH002',
    name: 'Heritage Wooden Dining Set',
    category: 'Dining Room',
    price: 38500,
    originalPrice: 45000,
    rating: 4.8,
    stock: 4,
    color: 'Walnut',
    material: 'Solid Wood',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Hand-finished dining furniture that adds warmth to every gathering and everyday family meals.',
    tags: 'Bestseller',
    newArrival: false,
    featured: true
  },
  {
    code: 'FH003',
    name: 'Harbor Queen Bed Frame',
    category: 'Bedroom',
    price: 42000,
    originalPrice: 50000,
    rating: 4.9,
    stock: 6,
    color: 'Oak',
    material: 'Engineered Wood',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Crafted to enhance restful sleep with clean lines, ample storage, and durable construction.',
    tags: 'New Arrival',
    newArrival: true,
    featured: true
  },
  {
    code: 'FH004',
    name: 'Summit Executive Desk',
    category: 'Office',
    price: 26300,
    originalPrice: 30500,
    rating: 4.7,
    stock: 12,
    color: 'Charcoal',
    material: 'Laminated MDF',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'A smart work-from-home desk with cable management and a clean silhouette that promotes focus.',
    tags: 'Popular',
    newArrival: false,
    featured: true
  },
  {
    code: 'FH005',
    name: 'Aster Lounge Chair',
    category: 'Living Room',
    price: 18400,
    originalPrice: 22500,
    rating: 4.7,
    stock: 9,
    color: 'Sand',
    material: 'Boucle Fabric',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Soft, sculpted seating that introduces texture and calm to reading corners and lounges.',
    tags: 'Hot Deal',
    newArrival: false,
    featured: false
  },
  {
    code: 'FH006',
    name: 'Terrace Patio Set',
    category: 'Outdoor',
    price: 32100,
    originalPrice: 39000,
    rating: 4.8,
    stock: 5,
    color: 'Teak',
    material: 'Weatherproof Wood',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Outdoor furniture built to withstand daily use while keeping your patio relaxed and inviting.',
    tags: 'Outdoor Living',
    newArrival: true,
    featured: true
  },
  {
    code: 'FH007',
    name: 'Nova Office Chair',
    category: 'Office',
    price: 16000,
    originalPrice: 20500,
    rating: 4.6,
    stock: 15,
    color: 'Black',
    material: 'Mesh & Nylon',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Comfortable ergonomic seating with a breathable back and smooth rolling casters.',
    tags: 'Ergonomic',
    newArrival: false,
    featured: false
  },
  {
    code: 'FH008',
    name: 'Luna Storage Wardrobe',
    category: 'Bedroom',
    price: 33800,
    originalPrice: 42000,
    rating: 4.9,
    stock: 3,
    color: 'White Oak',
    material: 'Wood Composite',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Thoughtful bedroom storage with sliding doors and generous compartments for everyday essentials.',
    tags: 'Storage',
    newArrival: true,
    featured: true
  }
];

async function main() {
  const categoryIds = new Map();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
    categoryIds.set(saved.name, saved.id);
  }

  for (const product of products) {
    const { category, ...data } = product;
    await prisma.product.upsert({
      where: { code: product.code },
      update: { ...data, categoryId: categoryIds.get(category) },
      create: { ...data, categoryId: categoryIds.get(category) }
    });
  }
}

main()
  .then(() => console.log('Furniture Hub sample catalog is ready.'))
  .catch((error) => {
    console.error('Could not seed the Furniture Hub catalog:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
