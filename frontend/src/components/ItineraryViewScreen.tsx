import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Calendar, Share2, Edit, DollarSign } from 'lucide-react';
import { getTripBudget, getCollaborators, inviteCollaborator, removeCollaborator, getTripPDFUrl, getTripAnalytics } from '../utils/api';
import type { Collaborator } from '../types';

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

export default function ItineraryViewScreen({ user, trips }: { user: User; trips: Trip[] }) {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const trip = trips.find(t => t.id === tripId);
  const [budget, setBudget] = useState<any>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabError, setCollabError] = useState<string | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);

  // Fetch budget
  useEffect(() => {
    const fetchBudget = async () => {
      if (!tripId || !user) return;
      setLoadingBudget(true);
      setBudgetError(null);
      try {
        // Assume user has a token property; adjust as needed
        const token = (user as any).token || localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const data = await getTripBudget(tripId, token);
        setBudget(data);
      } catch (e: any) {
        setBudgetError(e.message || 'Failed to fetch budget');
      } finally {
        setLoadingBudget(false);
      }
    };
    fetchBudget();
  }, [tripId, user]);

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!tripId || !user) return;
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const token = (user as any).token || localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const data = await getTripAnalytics(tripId, token);
        setAnalytics(data);
      } catch (e: any) {
        setAnalyticsError(e.message || 'Failed to fetch analytics');
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [tripId, user]);

  // Fetch collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      if (!tripId || !user) return;
      setCollabError(null);
      try {
        const token = (user as any).token || localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const data = await getCollaborators(tripId, token);
        setCollaborators(data);
      } catch (e: any) {
        setCollabError(e.message || 'Failed to fetch collaborators');
      }
    };
    fetchCollaborators();
  }, [tripId, user]);

  const handleInvite = async () => {
    if (!collabEmail) return;
    setCollabLoading(true);
    setCollabError(null);
    try {
      const token = (user as any).token || localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      await inviteCollaborator(tripId!, collabEmail, 'editor', token);
      setCollabEmail('');
      // Refresh list
      const data = await getCollaborators(tripId!, token);
      setCollaborators(data);
    } catch (e: any) {
      setCollabError(e.message || 'Failed to invite');
    } finally {
      setCollabLoading(false);
    }
  };

  if (!trip) {
  return <div className="flex items-center justify-center min-h-screen text-2xl text-gray-400">Trip not found</div>;
  }

  const duration = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));

  // Helper to get symbol
  const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', INR: '₹' };
  const userCurrency = (user as any).currency_preference || 'USD';
  const avgPerDay = budget && budget.average_per_day_currencies ? budget.average_per_day_currencies[userCurrency] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-white/80 border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/trips')} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">{trip.name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate(`/trip/${tripId}/share`)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => navigate(`/trip/${tripId}/build`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Trip Overview */}
            <Card className="shadow-md border-0">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-blue-900">{trip.name}</h2>
                    <p className="text-gray-600 mb-4 text-lg">{trip.description}</p>
                  </div>
                  {trip.isPublic && (
                    <Badge className="bg-green-100 text-green-800">Public</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-100 rounded-xl shadow-sm">
                    <Calendar className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-700 font-medium">Duration</p>
                    <p className="text-xl font-bold">{duration} days</p>
                  </div>
                  <div className="text-center p-4 bg-green-100 rounded-xl shadow-sm">
                    <MapPin className="w-7 h-7 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-700 font-medium">Cities</p>
                    <p className="text-xl font-bold">{trip.cities.length}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-100 rounded-xl shadow-sm">
                    <DollarSign className="w-7 h-7 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-purple-700 font-medium">Budget</p>
                    <p className="text-xl font-bold">${trip.totalCost}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-100 rounded-xl shadow-sm">
                    <Calendar className="w-7 h-7 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-orange-700 font-medium">Avg Cost/Day</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itinerary Timeline */}
            <Card className="shadow border-0">
              <CardHeader className="bg-gray-50 rounded-t-xl">
                <CardTitle className="text-blue-900">Itinerary Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {trip.cities.length > 0 ? (
                  <div className="space-y-6">
                    {trip.cities.map((city, index) => (
                      <div key={index} className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          {index < trip.cities.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="font-semibold text-lg text-blue-900">{city}</h3>
                          <p className="text-gray-600 text-sm mb-3">
                            Day {index + 1} - {index + 2}
                          </p>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-600">No activities planned yet</p>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => navigate(`/trip/${tripId}/build`)}
                            >
                              Add Activities
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No cities in your itinerary yet</p>
                    <Button onClick={() => navigate(`/trip/${tripId}/build`)}>
                      Start Planning
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="shadow border-0">
              <CardHeader className="bg-blue-50 rounded-t-xl">
                <CardTitle className="text-blue-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-700" />
                  Trip Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/build`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Itinerary
                </Button>
                <a href={getTripPDFUrl(tripId!)} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start mt-2">
                    <span role="img" aria-label="PDF">📄</span> Export as PDF
                  </Button>
                </a>
                <Button variant="outline" className="w-full justify-start mt-2" onClick={() => setAnalyticsLoading(!analyticsLoading)}>
                  <span role="img" aria-label="Analytics">📊</span> View Analytics
                </Button>
                {analyticsLoading && (
                  <div className="p-2 bg-gray-50 rounded mt-2">
                    {analyticsError ? (
                      <span className="text-red-500 text-xs">{analyticsError}</span>
                    ) : analytics ? (
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>Total Expenses: <b>{analytics.totalExpenses}</b></li>
                        <li>Stops: <b>{analytics.stopCount}</b></li>
                        <li>Activities: <b>{analytics.activityCount}</b></li>
                        <li>Collaborators: <b>{analytics.collaboratorCount}</b></li>
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400">Loading analytics...</span>
                    )}
                  </div>
                )}
                <Button variant="outline" className="w-full justify-start mt-2" onClick={() => navigate(`/trip/${tripId}/budget`)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Budget
                </Button>
                <Button variant="outline" className="w-full justify-start mt-2" onClick={() => navigate(`/trip/${tripId}/calendar`)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar View
                </Button>
                <Button variant="outline" className="w-full justify-start mt-2" onClick={() => navigate(`/trip/${tripId}/share`)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Trip
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow border-0">
              <CardHeader className="bg-gray-50 rounded-t-xl">
                <CardTitle className="text-blue-900">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-semibold">{new Date(trip.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-semibold">{new Date(trip.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant="secondary">
                    {new Date(trip.startDate) > new Date() ? 'Upcoming' : 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}