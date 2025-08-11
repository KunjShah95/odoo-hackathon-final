import { Trip } from '../types';

export const getTripDuration = (startDate: string, endDate: string): number => {
  return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
};

export const getTripStatus = (trip: Trip): 'upcoming' | 'active' | 'completed' => {
  const now = new Date();
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  if (startDate > now) return 'upcoming';
  if (endDate < now) return 'completed';
  return 'active';
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'upcoming': return 'bg-blue-100 text-blue-800';
    case 'active': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getCostLevel = (cost: number) => {
  if (cost <= 80) return { label: 'Budget', color: 'bg-green-100 text-green-800' };
  if (cost <= 150) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Luxury', color: 'bg-red-100 text-red-800' };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const generateDays = (startDate: string, endDate: string): Date[] => {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert('Failed to copy link');
  }
};