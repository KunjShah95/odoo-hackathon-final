import React, { useState, useCallback, useEffect } from 'react';
import { getActivitySuggestion, getWeather } from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowLeft, Plus, MapPin, Calendar, Edit, GripVertical, Trash2, Clock, DollarSign } from 'lucide-react';
import { User, Trip } from '../types';
import { getStops, createStop, deleteStop, reorderStops } from '../utils/api';
import { formatDate, getTripDuration } from '../utils';
import CollaboratorsPanel from './CollaboratorsPanel';
import ExpenseSplitter from './ExpenseSplitter';
import PackingListGenerator from './PackingListGenerator';
import MapView from './MapView';
import RealtimeCollabPanel from './RealtimeCollabPanel';

interface ItineraryBuilderScreenProps {
  user: User;
  trips: Trip[];
  onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void;
}

interface CityStop {
  id: string;
  name: string;
  days: number;
  startDay: number;
  activities: Activity[];
  notes: string;
}

interface Activity {
  id: string;
  name: string;
  time: string;
  duration: string;
  cost: number;
  description: string;
}

const SAMPLE_ACTIVITIES: Activity[] = [
  { id: '1', name: 'Eiffel Tower Visit', time: '09:00', duration: '2-3 hours', cost: 35, description: 'Iconic landmark with city views' },
  { id: '2', name: 'Louvre Museum', time: '14:00', duration: '3-4 hours', cost: 17, description: 'World famous art museum' },
  { id: '3', name: 'Seine River Cruise', time: '19:00', duration: '1.5 hours', cost: 25, description: 'Evening cruise with dinner' }
];

// Drag and drop item types
const ItemTypes = {
  CITY: 'city',
  ACTIVITY: 'activity'
};

// Draggable City Component
const DraggableCity = ({ city, index, moveCity, onEdit, onDelete }: {
  city: CityStop;
  index: number;
  moveCity: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (city: CityStop) => void;
  onDelete: (cityId: string) => void;
}) => {
  const [suggestion, setSuggestion] = React.useState<any>(null);
  const [weather, setWeather] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const [sugg, wthr] = await Promise.all([
          getActivitySuggestion(city.name, token),
          getWeather(city.name, token)
        ]);
        setSuggestion(sugg);
        setWeather(wthr);
      } catch (e: any) {
        setError(e.message || 'Failed to load info');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [city.name]);
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.CITY,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.CITY,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveCity(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <Card 
      ref={(node) => preview(drop(node))}
      className={`transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              ref={drag}
              className="cursor-move p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{city.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {city.days} {city.days === 1 ? 'day' : 'days'}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Day {city.startDay}-{city.startDay + city.days - 1}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(city)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(city.id)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Activity Suggestion & Weather */}
        <div className="mb-3">
          {loading ? (
            <span className="text-xs text-gray-400">Loading city info...</span>
          ) : error ? (
            <span className="text-xs text-red-500">{error}</span>
          ) : (
            <>
              {suggestion && (
                <div className="mb-2 p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-800">Suggested: {suggestion.title}</div>
                  <div className="text-xs text-blue-700 mb-1">{suggestion.description}</div>
                  {suggestion.image && <img src={suggestion.image} alt="suggestion" className="w-24 h-16 object-cover rounded" />}
                  {suggestion.wikiUrl && <a href={suggestion.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline ml-1">Learn more</a>}
                </div>
              )}
              {weather && (
                <div className="mb-2 p-2 bg-yellow-50 rounded flex items-center space-x-2">
                  <span className="font-semibold text-yellow-800">Weather:</span>
                  <span className="text-xs">{weather.temp}°C, {weather.description}</span>
                  {weather.icon && <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} alt="weather" className="w-6 h-6" />}
                </div>
              )}
            </>
          )}
        </div>

        {/* Activities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Activities</h4>
            <Button size="sm" variant="ghost">
              <Plus className="w-4 h-4 mr-1" />
              Add Activity
            </Button>
          </div>
          
          {city.activities.length > 0 ? (
            <div className="space-y-2">
              {city.activities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">{activity.name}</h5>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{activity.duration}</span>
                      <span>${activity.cost}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-3">No activities added yet</p>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Activity
              </Button>
            </div>
          )}
        </div>

        {/* Notes */}
        {city.notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-1">Notes</h5>
            <p className="text-sm text-blue-700">{city.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ItineraryBuilderScreen({ user, trips, onUpdateTrip }: ItineraryBuilderScreenProps) {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const trip = trips.find(t => t.id === tripId);

  const [cities, setCities] = useState<CityStop[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopsError, setStopsError] = useState<string | null>(null);
  // Load stops from backend
  useEffect(() => {
    const loadStops = async () => {
      if (!tripId) return;
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoadingStops(true); setStopsError(null);
      try {
        const stops = await getStops(tripId, token);
        const mapped: CityStop[] = stops.map((s: any, idx: number) => ({
          id: String(s.id),
          name: s.city_name,
          days: 2,
          startDay: idx * 2 + 1,
          activities: idx === 0 ? SAMPLE_ACTIVITIES : [],
          notes: ''
        }));
        setCities(mapped);
      } catch (e: any) {
        setStopsError(e.message || 'Failed to load stops');
      } finally {
        setLoadingStops(false);
      }
    };
    loadStops();
  }, [tripId]);

  const [newCityName, setNewCityName] = useState('');
  const [showAddCity, setShowAddCity] = useState(false);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const duration = getTripDuration(trip.startDate, trip.endDate);

  const moveCity = useCallback((dragIndex: number, hoverIndex: number) => {
    setCities(prev => {
      const arr = [...prev];
      const item = arr[dragIndex];
      arr.splice(dragIndex, 1);
      arr.splice(hoverIndex, 0, item);
      let d = 1; arr.forEach(c => { c.startDay = d; d += c.days; });
      const token = localStorage.getItem('token');
      if (token && tripId) {
        reorderStops(tripId, arr.map((c, i) => ({ stopId: Number(c.id), order_index: i })), token).catch(console.error);
      }
      return arr;
    });
  }, [tripId]);

  const handleAddCity = () => {
    if (!newCityName.trim() || !tripId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    createStop(tripId, { city_name: newCityName.trim() }, token)
      .then(stop => {
        setCities(prev => [...prev, { id: String(stop.id), name: stop.city_name, days: 2, startDay: prev.length * 2 + 1, activities: [], notes: '' }]);
        setNewCityName('');
        setShowAddCity(false);
      })
      .catch(err => {
        console.error(err); alert('Failed to add city');
      });
  };

  const handleEditCity = (city: CityStop) => {
    // Navigate to city edit modal or expand inline editing
    console.log('Edit city:', city);
  };

  const handleDeleteCity = (cityId: string) => {
    if (!window.confirm('Are you sure you want to remove this city from your trip?')) return;
    const token = localStorage.getItem('token');
    if (token) deleteStop(Number(cityId), token).catch(console.error);
    setCities(prev => prev.filter(c => c.id !== cityId));
  };

  const totalActivitiesCost = cities.reduce((total, city) => 
    total + city.activities.reduce((cityTotal, activity) => cityTotal + activity.cost, 0), 0
  );

  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <header className="bg-white/80 border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => navigate('/trips')} className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back to Trips</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">Build Itinerary</h1>
                  <p className="text-sm text-gray-600 hidden sm:block">{trip.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${tripId}/view`)}>
                  Preview
                </Button>
                <Button variant={trip.isPublic ? 'outline' : 'default'} size="sm" onClick={() => onUpdateTrip(trip.id, { isPublic: !trip.isPublic })}>
                  {trip.isPublic ? 'Make Private' : 'Make Public'}
                </Button>
                <Button size="sm" onClick={() => navigate(`/trip/${tripId}/view`)}>
                  Save & View
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RealtimeCollabPanel user={user} tripId={tripId!} />
          <CollaboratorsPanel tripId={tripId} />
          <ExpenseSplitter />
          <PackingListGenerator />
          <MapView trip={trip} />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Trip Overview */}
              <Card className="shadow-md border-0 mb-8">
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 text-blue-900">{trip.name}</h2>
                      <p className="text-gray-600 text-lg">{trip.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-lg">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-1 text-blue-600" />
                        <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{duration} days</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cities & Itinerary */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-blue-900">Cities & Activities</h2>
                  <Button onClick={() => setShowAddCity(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add City
                  </Button>
                </div>

                {/* Add City Form */}
                {showAddCity && (
                  <Card className="border-dashed border-2 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <Input
                          placeholder="Enter city name..."
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
                          className="flex-1"
                        />
                        <div className="flex space-x-2">
                          <Button onClick={handleAddCity}>Add</Button>
                          <Button variant="outline" onClick={() => setShowAddCity(false)}>Cancel</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cities List */}
                {loadingStops && <div className="text-sm text-gray-500">Loading stops...</div>}
                {stopsError && <div className="text-sm text-red-600">{stopsError}</div>}
                {cities.length > 0 ? (
                  <div className="space-y-8">
                    {cities.map((city, index) => (
                      <DraggableCity
                        key={city.id}
                        city={city}
                        index={index}
                        moveCity={moveCity}
                        onEdit={handleEditCity}
                        onDelete={handleDeleteCity}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="p-8 text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No cities added yet</h3>
                      <p className="text-gray-600 mb-4">Start building your itinerary by adding cities</p>
                      <Button onClick={() => setShowAddCity(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First City
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Trip Stats */}
              <Card className="shadow border-0">
                <CardHeader className="bg-blue-50 rounded-t-xl">
                  <CardTitle className="text-blue-900">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <Badge className="bg-blue-100 text-blue-800">{duration} days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cities</span>
                    <Badge className="bg-blue-100 text-blue-800">{cities.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Activities</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {cities.reduce((total, city) => total + city.activities.length, 0)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Activities Cost</span>
                    <Badge className="bg-blue-100 text-blue-800">${totalActivitiesCost}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow border-0">
                <CardHeader className="bg-blue-50 rounded-t-xl">
                  <CardTitle className="text-blue-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/search/cities')}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Cities
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/search/activities')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Find Activities
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/budget`)}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Budget Tracker
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/trip/${tripId}/calendar`)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar View
                  </Button>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-blue-50 border-blue-200 shadow border-0">
                <CardHeader>
                  <CardTitle className="text-blue-800">💡 Pro Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-blue-700">• Drag cities to reorder your itinerary</p>
                  <p className="text-blue-700">• Add 2-3 activities per day for optimal pacing</p>
                  <p className="text-blue-700">• Consider travel time between cities</p>
                  <p className="text-blue-700">• Book popular activities in advance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}