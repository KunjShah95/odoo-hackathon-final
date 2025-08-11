import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Search, Clock, DollarSign, Star, Plus, MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { User } from '../types';
import { SAMPLE_ACTIVITIES, ACTIVITY_CATEGORIES } from '../constants';

interface ActivitySearchScreenProps {
  user: User;
}

export default function ActivitySearchScreen({ user }: ActivitySearchScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredActivities = (SAMPLE_ACTIVITIES || []).filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Find Activities</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(ACTIVITY_CATEGORIES || ['all']).map(category => (
              <Button
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
              <Card key={activity.id} className="group hover:shadow-lg transition-shadow">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <ImageWithFallback
                    src={activity.image}
                    alt={activity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge>{activity.category}</Badge>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{activity.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {activity.city}
                      </p>
                    </div>
                    
                    <p className="text-gray-600 text-sm">{activity.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {activity.duration}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                        {activity.rating}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">${activity.price}</span>
                      </div>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Trip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No activities found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Activities will be loaded here'
                }
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}