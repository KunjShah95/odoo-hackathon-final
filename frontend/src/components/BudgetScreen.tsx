import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, DollarSign, PieChart, TrendingUp } from 'lucide-react';
import { getTripBudget, upsertTripBudget, getExpenses } from '../utils/api';
import { Input } from './ui/input';

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
  const [expensesTotal, setExpensesTotal] = useState<number>(0);
  const [edit, setEdit] = useState<{ transport_cost?: number; stay_cost?: number; activity_cost?: number; meal_cost?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSaveBudget = async () => {
    if (!edit) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    const token = (user as any).token || localStorage.getItem('token');
    if(!token) {
      setSaveError('Please log in to save budget');
      setSaving(false);
      return;
    }
    try {
      const payload = { 
        transport_cost: Number(edit.transport_cost) || 0, 
        stay_cost: Number(edit.stay_cost) || 0, 
        activity_cost: Number(edit.activity_cost) || 0, 
        meal_cost: Number(edit.meal_cost) || 0 
      };
      const saved = await upsertTripBudget(tripId as string, payload, token);
      setBudget(saved);
      setEdit(null);
      setSaveSuccess('Budget saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch(e: any) {
      setSaveError(e?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchBudget = async () => {
      if (!tripId || !user) return;
      setLoadingBudget(true);
      setBudgetError(null);
      try {
        const token = (user as any).token || localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const [b, exps] = await Promise.all([
          getTripBudget(tripId as string, token).catch(()=>null),
          getExpenses(tripId as string, token).catch(()=>[])
        ]);
        if (b) setBudget(b);
        const total = Array.isArray(exps) ? exps.reduce((s: number, e: any) => s + Number(e.amount||0), 0) : 0;
        setExpensesTotal(total);
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

  const current = budget && budget.transport_cost!==undefined ? budget : null;
  const totals = current ? {
    transport_cost: Number(current.transport_cost||0),
    stay_cost: Number(current.stay_cost||0),
    activity_cost: Number(current.activity_cost||0),
    meal_cost: Number(current.meal_cost||0),
    total_cost: Number(current.total_cost||0)
  } : null;
  const display = edit || totals || { transport_cost: 0, stay_cost: 0, activity_cost: 0, meal_cost: 0, total_cost: 0 } as any;
  const grandTotal = display.transport_cost + display.stay_cost + display.activity_cost + display.meal_cost;
  const breakdown = [
    { key: 'stay_cost', label: 'Accommodation', value: display.stay_cost },
    { key: 'transport_cost', label: 'Transportation', value: display.transport_cost },
    { key: 'meal_cost', label: 'Food & Dining', value: display.meal_cost },
    { key: 'activity_cost', label: 'Activities', value: display.activity_cost },
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
                    <p className="text-2xl font-bold text-blue-600">{currencySymbols[userCurrency]}{grandTotal.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Planned Budget</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{currencySymbols[userCurrency]}{expensesTotal.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Recorded Expenses</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{currencySymbols[userCurrency]}{Math.max(0, grandTotal - expensesTotal).toFixed(2)}</p>
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
                  {breakdown.map(item => {
                    const pct = grandTotal>0 ? Math.round((item.value / grandTotal) * 100) : 0;
                    return (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{item.label}</span>
                            {edit ? (
                              <Input type="number" className="w-28" value={item.value}
                                onChange={e=> setEdit(prev=> ({ ...(prev||{}), [item.key]: Number(e.target.value) }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !saving) {
                                    e.preventDefault();
                                    handleSaveBudget();
                                  }
                                }} />
                            ) : (
                              <span className="font-semibold">{currencySymbols[userCurrency]}{item.value.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{pct}% of budget</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-4">
                  {edit ? (
                    <>
                      <Button size="sm" disabled={saving} data-save-budget onClick={handleSaveBudget}>{saving ? 'Saving...' : 'Save'}</Button>
                      <Button size="sm" variant="outline" disabled={saving} onClick={()=> { setEdit(null); setSaveError(null); setSaveSuccess(null); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={()=> setEdit({
                        transport_cost: totals?.transport_cost||0,
                        stay_cost: totals?.stay_cost||0,
                        activity_cost: totals?.activity_cost||0,
                        meal_cost: totals?.meal_cost||0,
                      })}>Edit Budget</Button>
                      {!budget && (
                        <Button size="sm" onClick={()=> setEdit({
                          transport_cost: 0,
                          stay_cost: 0,
                          activity_cost: 0,
                          meal_cost: 0,
                        })}>Create Budget</Button>
                      )}
                    </>
                  )}
                </div>
                {saveError && <div className="text-xs text-red-600 mt-2">{saveError}</div>}
                {saveSuccess && <div className="text-xs text-green-600 mt-2">{saveSuccess}</div>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={()=> navigate(`/trip/${tripId}/build`)}>
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