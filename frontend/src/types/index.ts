export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
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