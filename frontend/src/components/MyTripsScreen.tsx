import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Edit, 
  Eye, 
  Trash2, 
  Share2,
  Filter,
  Plane
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
  coverPhoto?: string;
}

interface MyTripsScreenProps {
  user: User;
  trips: Trip[];
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void;
  onDeleteTrip: (tripId: string) => void;
}

export default function MyTripsScreen({ user, trips, onUpdateTrip, onDeleteTrip }: MyTripsScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all');

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    switch (filterStatus) {
      case 'upcoming':
        return startDate > now;
      case 'past':
        return endDate < now;
      default:
        return true;
    }
  });

  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    if (startDate > now) return 'upcoming';
    if (endDate < now) return 'completed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteTrip = (tripId: string, tripName: string) => {
    if (window.confirm(`Are you sure you want to delete "${tripName}"? This action cannot be undone.`)) {
      onDeleteTrip(tripId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white/80 border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">My Trips</h1>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/create-trip')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
          </div>
        </div>
    </header>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search and Filters */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trips by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All Trips
              </Button>
              <Button
                variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={filterStatus === 'past' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('past')}
              >
                Past
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-lg">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
            </p>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map(trip => {
              const status = getTripStatus(trip);
              return (
                <Card key={trip.id} className="group hover:shadow-xl transition-shadow duration-300 border-0 shadow-md">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-xl overflow-hidden">
                      {trip.coverPhoto ? (
                        <ImageWithFallback
                          src={trip.coverPhoto}
                          alt={trip.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="w-12 h-12 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className={getStatusColor(status)}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    {trip.isPublic && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90">
                          <Share2 className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-xl mb-1 text-blue-900">{trip.name}</h3>
                        <p className="text-gray-600 text-base line-clamp-2">{trip.description}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-base text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-base text-gray-500">
                          <MapPin className="w-4 h-4 mr-2" />
                          {trip.cities.length > 0 ? (
                            `${trip.cities.length} ${trip.cities.length === 1 ? 'city' : 'cities'}`
                          ) : (
                            'No cities added yet'
                          )}
                        </div>
                        <div className="flex items-center text-base text-gray-500">
                          <DollarSign className="w-4 h-4 mr-2" />
                          ${trip.totalCost.toLocaleString()} budget
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/trip/${trip.id}/view`)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/trip/${trip.id}/build`)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateTrip(trip.id, { isPublic: !trip.isPublic })}
                          className="flex-1"
                        >
                          {trip.isPublic ? 'Private' : 'Public'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteTrip(trip.id, trip.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-blue-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No trips found' : 'No trips yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start planning your first adventure! Create a trip and begin exploring the world.'
              }
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button 
                onClick={() => navigate('/create-trip')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Trip
              </Button>
            )}
            {(searchQuery || filterStatus !== 'all') && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
