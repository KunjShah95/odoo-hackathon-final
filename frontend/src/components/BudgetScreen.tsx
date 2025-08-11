import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, DollarSign, PieChart, TrendingUp } from 'lucide-react';

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
  const trip = trips.find(t => t.id === tripId);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const budgetBreakdown = [
    { category: 'Accommodation', amount: 800, percentage: 40 },
    { category: 'Transportation', amount: 600, percentage: 30 },
    { category: 'Food & Dining', amount: 400, percentage: 20 },
    { category: 'Activities', amount: 200, percentage: 10 }
  ];

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
                    <p className="text-2xl font-bold text-purple-600">$180</p>
                    <p className="text-sm text-gray-600">Per Day</p>
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