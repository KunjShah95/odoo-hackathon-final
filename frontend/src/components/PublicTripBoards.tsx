import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { MapPin, Calendar, Copy, ArrowLeft, Plane, Filter, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PublicTripBoardsProps {
  user: User;
  trips: Trip[];
  onCloneTrip: (trip: Trip) => void;
}

interface BoardCategory {
  id: string;
  name: string;
  filter: (t: Trip) => boolean;
  description: string;
}

const categories: BoardCategory[] = [
  { id: 'all', name: 'All Public', filter: () => true, description: 'All public itineraries shared by you' },
  { id: 'upcoming', name: 'Upcoming', filter: t => new Date(t.startDate) > new Date(), description: 'Trips starting soon' },
  { id: 'short', name: 'Short (<=5d)', filter: t => ((new Date(t.endDate).getTime() - new Date(t.startDate).getTime())/86400000) <= 5, description: 'Weekend & short getaways' },
  { id: 'long', name: 'Long (>=10d)', filter: t => ((new Date(t.endDate).getTime() - new Date(t.startDate).getTime())/86400000) >= 10, description: 'Extended adventures' },
];

export default function PublicTripBoards({ user, trips, onCloneTrip }: PublicTripBoardsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');

  const publicTrips = useMemo(() => (trips || []).filter(t => t.isPublic), [trips]);
  const filteredTrips = publicTrips.filter(t => {
    const cat = categories.find(c => c.id === activeTab) || categories[0];
    if (!cat.filter(t)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.cities.some(c => c.toLowerCase().includes(q));
  });

  const handleClone = (trip: Trip) => {
    const clone: Trip = {
      ...trip,
      id: `${trip.id}-clone-${Date.now()}`,
      name: `${trip.name} (Copy)`,
      isPublic: false,
    };
    onCloneTrip(clone);
    navigate(`/trip/${clone.id}/build`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-white/80 border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mr-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">Public Trip Boards</h1>
            </div>
            <Button onClick={() => navigate('/create-trip')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Create Trip</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search public trips..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:w-[600px] bg-blue-50 rounded-xl">
            {categories.map(c => (
              <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
            ))}
          </TabsList>
          {categories.map(c => (
            <TabsContent key={c.id} value={c.id} className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-blue-900">{c.name}</CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTrips.map(trip => (
                        <Card key={trip.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="relative h-40 rounded-t-lg overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                            {trip.coverPhoto ? (
                              <ImageWithFallback src={trip.coverPhoto} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><MapPin className="w-10 h-10 text-blue-400" /></div>
                            )}
                            <div className="absolute top-3 left-3">
                              <Badge variant="secondary" className="bg-white/90">Public</Badge>
                            </div>
                          </div>
                          <CardContent className="p-5 space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg text-blue-900 mb-1 line-clamp-1">{trip.name}</h3>
                              <p className="text-gray-600 text-sm line-clamp-2">{trip.description}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(trip.startDate).toLocaleDateString()}</div>
                              <div className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{trip.cities.length} cities</div>
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/trip/${trip.id}/view`)}>View</Button>
                              <Button size="sm" className="flex-1" onClick={() => handleClone(trip)}>
                                <Copy className="w-3 h-3 mr-1" /> Clone
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No trips match this filter yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
