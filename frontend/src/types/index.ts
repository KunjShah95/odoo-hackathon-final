export interface Collaborator {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: string;
  invited_by?: number;
  created_at: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency_preference?: 'USD' | 'EUR' | 'INR';
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  cities: string[];
  totalCost: number;
  isPublic: boolean;
}

export interface City {
  id: string;
  name: string;
  country: string;
  continent: string;
  image: string;
  costIndex: number;
  rating: number;
  description: string;
  popularActivities: string[];
  averageCost: number;
}

export interface Activity {
  id: string;
  name: string;
  city: string;
  category: string;
  price: number;
  duration: string;
  rating: number;
  image: string;
  description: string;
}

export interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
}

// In-app notification model for smart notifications center
export interface NotificationItem {
  id: string;
  type: 'trip' | 'weather' | 'collaboration' | 'system' | 'suggestion';
  title: string;
  message: string;
  createdAt: string; // ISO timestamp
  read?: boolean;
  tripId?: string; // optional linking
  severity?: 'info' | 'warning' | 'success';
}