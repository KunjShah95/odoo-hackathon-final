import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Calendar, MapPin, Clock, Plus, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, Trip } from '../types';
import { generateDays, formatDate } from '../utils';

interface CalendarScreenProps {
  user: User;
  trips: Trip[];
}

const SAMPLE_SCHEDULE = {
  '09:00': { activity: 'Breakfast at local café', location: 'City Center', cost: 25 },
  '10:30': { activity: 'Eiffel Tower Visit', location: 'Champ de Mars', cost: 35 },
  '14:00': { activity: 'Lunch break', location: 'Latin Quarter', cost: 40 },
  '15:30': { activity: 'Louvre Museum', location: 'Rue de Rivoli', cost: 17 },
  '19:00': { activity: 'Seine River Cruise', location: 'Port de la Bourdonnais', cost: 25 }
};

export default function CalendarScreen({ user, trips }: CalendarScreenProps) {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const trip = trips.find(t => t.id === tripId);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [selectedDay, setSelectedDay] = useState(0);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const days = generateDays(trip.startDate, trip.endDate);

  const TimelineView = () => (
    <div className="space-y-6">
      {days.map((day, index) => (
        <Card key={index} className={selectedDay === index ? 'ring-2 ring-blue-500' : ''}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                    {index + 1}
                  </div>
                  Day {index + 1}
                </CardTitle>
                <p className="text-sm text-gray-600 ml-11">
                  {day.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {trip.cities[index] && (
                  <Badge className="bg-green-100 text-green-800">
                    <MapPin className="w-3 h-3 mr-1" />
                    {trip.cities[index]}
                  </Badge>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedDay(index)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {trip.cities[index] ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{trip.cities[index]}</span>
                </div>
                
                {/* Sample schedule for first day */}
                {index === 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium mb-3">Today's Schedule</h4>
                    {Object.entries(SAMPLE_SCHEDULE).map(([time, details]) => (
                      <div key={time} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div className="w-px h-8 bg-gray-300 mt-1"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                            <div>
                              <p className="font-medium">{details.activity}</p>
                              <p className="text-sm text-gray-600">{details.location}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {time}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                ${details.cost}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Activity
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">No activities scheduled</p>
                    <Button size="sm" onClick={() => navigate(`/trip/${tripId}/build`)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Activities
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-3">No destination planned for this day</p>
                <Button size="sm" onClick={() => navigate(`/trip/${tripId}/build`)}>
                  Plan This Day
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const CalendarView = () => {
    const currentDate = new Date();
    const tripStart = new Date(trip.startDate);
    const [viewDate, setViewDate] = useState(tripStart);
    
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const calendarDays = [];
    const current = new Date(startDate);
    
    while (current <= endOfMonth || current.getDay() !== 0) {
      calendarDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const checkIsTripDay = (date: Date) => {
      return days.some(tripDay => 
        tripDay.toDateString() === date.toDateString()
      );
    };

    const getTripDayNumber = (date: Date) => {
      const dayIndex = days.findIndex(tripDay => 
        tripDay.toDateString() === date.toDateString()
      );
      return dayIndex >= 0 ? dayIndex + 1 : null;
    };

    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
          
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isTripDay = checkIsTripDay(date);
            const tripDayNumber = getTripDayNumber(date);
            
            return (
              <div 
                key={index}
                className={`
                  aspect-square p-1 sm:p-2 border rounded-lg flex flex-col items-center justify-center relative cursor-pointer
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                  ${isTripDay ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
                  hover:bg-gray-100 transition-colors
                `}
                onClick={() => {
                  if (tripDayNumber !== null) {
                    setSelectedDay(tripDayNumber - 1);
                    setViewMode('timeline');
                  }
                }}
              >
                <span className={`text-sm ${isTripDay ? 'font-semibold text-blue-700' : ''}`}>
                  {date.getDate()}
                </span>
                {isTripDay && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  </div>
                )}
                {tripDayNumber && (
                  <div className="absolute top-1 right-1">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{tripDayNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Trip days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>Trip period</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/trip/${tripId}/view`)} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Trip</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Calendar View</h1>
                <p className="text-sm text-gray-600 hidden sm:block">{trip.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${tripId}/build`)}>
                <Edit className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Trip Info */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-xl font-bold mb-1">{trip.name}</h2>
                <p className="text-gray-600">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">{days.length} days</Badge>
                <Badge variant="secondary">{trip.cities.length} cities</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'timeline' | 'calendar')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <TimelineView />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}