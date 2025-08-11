import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Share2, Copy, Facebook, Twitter, ArrowLeft, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Trip } from '../types';
import { getTripDuration, copyToClipboard, formatDate } from '../utils';

interface SharedItineraryScreenProps {
  trips: Trip[];
}

export default function SharedItineraryScreen({ trips }: SharedItineraryScreenProps) {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const trip = trips.find(t => t.id === tripId);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const shareUrl = `${window.location.origin}/trip/${tripId}/share`;
  const duration = getTripDuration(trip.startDate, trip.endDate);

  const handleCopyLink = () => copyToClipboard(shareUrl);

  const tripStats = [
    { icon: Calendar, label: 'Duration', value: `${duration} days`, bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: MapPin, label: 'Cities', value: trip.cities.length.toString(), bg: 'bg-green-50', color: 'text-green-600' },
    { icon: DollarSign, label: 'Budget', value: `$${trip.totalCost}`, bg: 'bg-purple-50', color: 'text-purple-600' },
    { icon: Calendar, label: 'Cost/Day', value: `$${Math.round(trip.totalCost / duration)}`, bg: 'bg-orange-50', color: 'text-orange-600' }
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
            <h1 className="text-xl font-bold">Share - {trip.name}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="w-5 h-5 mr-2" />
                Share Your Trip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={shareUrl} 
                    readOnly 
                    className="flex-1 p-2 border rounded-md bg-gray-50"
                  />
                  <Button onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm">
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{trip.name}</CardTitle>
                  <p className="text-gray-600 mt-2">{trip.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Public</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {tripStats.map((stat, index) => (
                  <div key={index} className={`text-center p-3 ${stat.bg} rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Destinations</h3>
                {trip.cities.length > 0 ? (
                  <div className="space-y-3">
                    {trip.cities.map((city, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {index + 1}
                        </div>
                        <span className="font-medium">{city}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No destinations added yet</p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Like this itinerary?</p>
                  <Button onClick={() => navigate('/create-trip')}>
                    Copy This Trip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}