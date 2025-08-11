import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, DollarSign, PieChart, TrendingUp } from 'lucide-react';
import { getTripBudget } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  cities: string[];
  totalCost: number;
  isPublic: boolean;
}

export default function BudgetScreen({ user, trips }: { user: User; trips: Trip[] }) {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const trip = trips.find((t: Trip) => t.id === tripId);
  const [budget, setBudget] = useState<any>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudget = async () => {
      if (!tripId || !user) return;
      setLoadingBudget(true);
      setBudgetError(null);
      try {
        const token = (user as any).token || localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const data = await getTripBudget(tripId as string, token);
        setBudget(data);
      } catch (e: any) {
        setBudgetError(e.message || 'Failed to fetch budget');
      } finally {
        setLoadingBudget(false);
      }
    };
    fetchBudget();
  }, [tripId, user]);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  // Example breakdown, replace with real data if available
  const budgetBreakdown = [
    { category: 'Accommodation', amount: 800, percentage: 40 },
    { category: 'Transportation', amount: 600, percentage: 30 },
    { category: 'Food & Dining', amount: 400, percentage: 20 },
    { category: 'Activities', amount: 200, percentage: 10 }
  ];

  // Helper to get symbol
  const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', INR: '₹' };
  const userCurrency = (user as any).currency_preference || 'USD';
  const avgPerDay = budget && budget.average_per_day_currencies ? budget.average_per_day_currencies[userCurrency] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/trip/${tripId}/view`)} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trip
            </Button>
            <h1 className="text-xl font-bold">Budget Overview - {trip.name}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Budget Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">${trip.totalCost}</p>
                    <p className="text-sm text-gray-600">Total Budget</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">$1,800</p>
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">$700</p>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">Avg/Day</p>
                    {loadingBudget ? (
                      <p className="font-semibold">Loading...</p>
                    ) : budgetError ? (
                      <p className="text-red-500 text-xs">{budgetError}</p>
                    ) : avgPerDay !== null ? (
                      <div className="font-semibold flex flex-col items-center">
                        <span>{currencySymbols[userCurrency] || userCurrency}: {avgPerDay}</span>
                      </div>
                    ) : (
                      <p className="font-semibold">N/A</p>
                    )}
                    <p className="text-sm text-gray-600">Avg/Day ({userCurrency})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetBreakdown.map(item => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{item.category}</span>
                          <span className="font-semibold">${item.amount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.percentage}% of budget</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <PieChart className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>• Book accommodations early for better rates</p>
                  <p>• Consider public transportation</p>
                  <p>• Look for free activities and attractions</p>
                  <p>• Try local street food for authentic experiences</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}