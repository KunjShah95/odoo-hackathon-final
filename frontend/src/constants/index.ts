import { City, Activity, BudgetItem } from '../types';

export const SAMPLE_CITIES: City[] = [
  {
    id: '1',
    name: 'Paris',
    country: 'France',
    continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop',
    costIndex: 85,
    rating: 4.8,
    description: 'The City of Light, famous for its art, fashion, and romantic atmosphere.',
    popularActivities: ['Eiffel Tower', 'Louvre Museum', 'Seine River Cruise'],
    averageCost: 150
  },
  {
    id: '2',
    name: 'Tokyo',
    country: 'Japan',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
    costIndex: 75,
    rating: 4.9,
    description: 'A vibrant metropolis blending traditional culture with cutting-edge technology.',
    popularActivities: ['Senso-ji Temple', 'Shibuya Crossing', 'Tokyo Skytree'],
    averageCost: 120
  },
  {
    id: '3',
    name: 'New York',
    country: 'USA',
    continent: 'North America',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
    costIndex: 90,
    rating: 4.7,
    description: 'The Big Apple, a global hub of culture, finance, and entertainment.',
    popularActivities: ['Statue of Liberty', 'Central Park', 'Broadway Shows'],
    averageCost: 180
  },
  {
    id: '4',
    name: 'Bali',
    country: 'Indonesia',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop',
    costIndex: 35,
    rating: 4.6,
    description: 'Tropical paradise known for beautiful beaches, temples, and rice terraces.',
    popularActivities: ['Uluwatu Temple', 'Rice Terraces', 'Beach Clubs'],
    averageCost: 60
  },
  {
    id: '5',
    name: 'Rome',
    country: 'Italy',
    continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
    costIndex: 70,
    rating: 4.8,
    description: 'The Eternal City, where ancient history meets modern Italian charm.',
    popularActivities: ['Colosseum', 'Vatican City', 'Trevi Fountain'],
    averageCost: 110
  },
  {
    id: '6',
    name: 'Bangkok',
    country: 'Thailand',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=400&h=300&fit=crop',
    costIndex: 40,
    rating: 4.5,
    description: 'A bustling capital known for street food, temples, and vibrant nightlife.',
    popularActivities: ['Grand Palace', 'Floating Markets', 'Street Food Tours'],
    averageCost: 50
  }
];

export const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Eiffel Tower Visit',
    city: 'Paris',
    category: 'Sightseeing',
    price: 35,
    duration: '2-3 hours',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400&h=300&fit=crop',
    description: 'Visit the iconic Iron Lady and enjoy panoramic views of Paris.'
  },
  {
    id: '2',
    name: 'Sushi Making Class',
    city: 'Tokyo',
    category: 'Food & Drink',
    price: 85,
    duration: '3 hours',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop',
    description: 'Learn to make authentic sushi with a professional chef.'
  },
  {
    id: '3',
    name: 'Broadway Show',
    city: 'New York',
    category: 'Entertainment',
    price: 120,
    duration: '2.5 hours',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=300&fit=crop',
    description: 'Experience world-class theater in the heart of Manhattan.'
  }
];

export const CONTINENTS = ['all', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];

export const ACTIVITY_CATEGORIES = ['all', 'Sightseeing', 'Food & Drink', 'Entertainment', 'Adventure', 'Culture'];

export const COST_RANGES = [
  { key: 'all', label: 'All Budgets' },
  { key: 'low', label: 'Budget ($0-80/day)' },
  { key: 'medium', label: 'Moderate ($80-150/day)' },
  { key: 'high', label: 'Luxury ($150+/day)' }
];

export const POPULAR_DESTINATIONS = [
  { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=300&h=200&fit=crop' },
  { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&h=200&fit=crop' },
  { name: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300&h=200&fit=crop' },
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=300&h=200&fit=crop' }
];

export const DEFAULT_BUDGET_BREAKDOWN: BudgetItem[] = [
  { category: 'Accommodation', amount: 800, percentage: 40 },
  { category: 'Transportation', amount: 600, percentage: 30 },
  { category: 'Food & Dining', amount: 400, percentage: 20 },
  { category: 'Activities', amount: 200, percentage: 10 }
];

export const INSPIRATION_PHRASES = [
  "A journey of a thousand miles...",
  "Adventure awaits around every corner",
  "Discover new cultures and experiences",
  "Create memories that last a lifetime",
  "Explore the world one trip at a time"
];