import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plane, 
  TrendingUp,
  Users,
  Search,
  Settings,
  LogOut,
  Star,
  Clock,
  Globe
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { User, Trip } from '../types';
import { POPULAR_DESTINATIONS } from '../constants';
import { getTripStatus, getStatusColor } from '../utils';

interface DashboardScreenProps {
  user?: User;
  trips?: Trip[];
  onLogout: () => void;
}

const TRIP_TEMPLATES = [
  {
    id: 'european-classics',
    name: 'European Classics',
    description: 'Visit the most iconic cities in Europe',
    duration: '14 days',
    cities: ['Paris', 'Rome', 'Barcelona', 'Amsterdam'],
    estimatedCost: 2800,
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=300&h=200&fit=crop'
  },
  {
    id: 'asian-adventure',
    name: 'Asian Adventure',
    description: 'Experience the vibrant cultures of Asia',
    duration: '21 days',
    cities: ['Tokyo', 'Bangkok', 'Singapore', 'Seoul'],
    estimatedCost: 3500,
    difficulty: 'Moderate',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop'
  },
  {
    id: 'american-road-trip',
    name: 'American Road Trip',
    description: 'Cross-country adventure through the USA',
    duration: '18 days',
    cities: ['New York', 'Chicago', 'Denver', 'Los Angeles'],
    estimatedCost: 4200,
    difficulty: 'Moderate',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop'
  }
];

export default function DashboardScreen({ user, trips = [], onLogout }: DashboardScreenProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const upcomingTrips = (trips || []).filter(trip => new Date(trip.startDate) > new Date()).slice(0, 3);
  const recentTrips = (trips || []).slice(0, 3);
  const totalBudget = (trips || []).reduce((sum, trip) => sum + trip.totalCost, 0);

  const handleCreateFromTemplate = (template: typeof TRIP_TEMPLATES[0]) => {
    // Navigate to create trip with pre-filled data
    navigate('/create-trip', { state: { template } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">GlobeTrotter</h1>
            </div>
            
            {/* Mobile-optimized header actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/search/cities')} className="hidden sm:flex">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {(user?.name || 'U').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
                {/* Mobile menu button */}
                <div className="sm:hidden">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {(user?.name || 'User').split(' ')[0]}! ✈️
          </h2>
          <p className="text-gray-600">Ready to plan your next adventure?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{(trips || []).length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Trips</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Budget</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{upcomingTrips.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{(trips || []).filter(t => t.isPublic).length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Shared</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Start planning your next adventure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => navigate('/create-trip')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Plan New Trip
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/trips')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      My Trips
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/search/cities')}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Explore Cities
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/search/activities')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Find Activities
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Trips */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Upcoming Trips</CardTitle>
                      <CardDescription>Your next adventures await</CardDescription>
                    </div>
                    <Link to="/trips">
                      <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {upcomingTrips.length > 0 ? (
                      <div className="space-y-4">
                        {(upcomingTrips || []).map(trip => {
                          const status = getTripStatus(trip);
                          return (
                            <div key={trip.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold">{trip.name}</h4>
                                  <Badge className={getStatusColor(status)}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{trip.description}</p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {(trip.cities || []).length} {(trip.cities || []).length === 1 ? 'city' : 'cities'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">${trip.totalCost.toLocaleString()}</Badge>
                                <Button 
                                  size="sm" 
                                  onClick={() => navigate(`/trip/${trip.id}/view`)}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No upcoming trips yet.</p>
                        <Button onClick={() => navigate('/create-trip')}>
                          Plan Your First Trip
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trip Templates</CardTitle>
                <CardDescription>Get started quickly with our pre-designed itineraries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(TRIP_TEMPLATES || []).map(template => (
                    <Card key={template.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative h-40 overflow-hidden rounded-t-lg">
                        <ImageWithFallback
                          src={template.image}
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-gray-800">{template.difficulty}</Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {template.duration}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {(template.cities || []).length} cities
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className="font-semibold text-green-600">${template.estimatedCost}</span>
                            <Button 
                              size="sm"
                              onClick={() => handleCreateFromTemplate(template)}
                            >
                              Use Template
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Destinations</CardTitle>
                <CardDescription>Trending places to visit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(POPULAR_DESTINATIONS || []).map(destination => (
                    <div 
                      key={destination.name}
                      className="relative group cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      onClick={() => navigate('/search/cities')}
                    >
                      <ImageWithFallback
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <h4 className="font-semibold text-sm sm:text-base">{destination.name}</h4>
                        <p className="text-xs sm:text-sm opacity-90">{destination.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest trip planning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentTrips || []).map(trip => (
                    <div key={trip.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{trip.name}</h4>
                        <p className="text-sm text-gray-600">Last updated: {new Date(trip.startDate).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/trip/${trip.id}/view`)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}