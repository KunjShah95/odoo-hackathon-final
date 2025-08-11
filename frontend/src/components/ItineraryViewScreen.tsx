import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Calendar, Share2, Edit, DollarSign } from 'lucide-react';

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

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const duration = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/trips')} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">{trip.name}</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Trip Overview */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{trip.name}</h2>
                    <p className="text-gray-600 mb-4">{trip.description}</p>
                  </div>
                  {trip.isPublic && (
                    <Badge className="bg-green-100 text-green-800">Public</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{duration} days</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Cities</p>
                    <p className="font-semibold">{trip.cities.length}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold">${trip.totalCost}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Cost/Day</p>
                    <p className="font-semibold">${Math.round(trip.totalCost / duration)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itinerary Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Itinerary Timeline</CardTitle>
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
                          <h3 className="font-semibold text-lg">{city}</h3>
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trip Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/build`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Itinerary
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/budget`)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Budget
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/calendar`)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar View
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/share`)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Trip
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
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