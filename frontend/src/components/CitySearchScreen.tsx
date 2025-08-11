import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Search, MapPin, Star, Plus, Globe } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { User } from '../types';
import { SAMPLE_CITIES, CONTINENTS, COST_RANGES } from '../constants';
import { getCostLevel } from '../utils';

interface CitySearchScreenProps {
  user?: User;
}

export default function CitySearchScreen({ user }: CitySearchScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<string>('all');

  const filteredCities = (SAMPLE_CITIES || []).filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         city.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContinent = selectedContinent === 'all' || city.continent === selectedContinent;
    
    let matchesCost = true;
    if (costFilter === 'low') matchesCost = city.averageCost <= 80;
    else if (costFilter === 'medium') matchesCost = city.averageCost > 80 && city.averageCost <= 150;
    else if (costFilter === 'high') matchesCost = city.averageCost > 150;
    
    return matchesSearch && matchesContinent && matchesCost;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold">Explore Cities</h1>
              </div>
            </div>
            <Button onClick={() => navigate('/search/activities')}>
              <Search className="w-4 h-4 mr-2" />
              Find Activities
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search cities or countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
              {(CONTINENTS || ['all']).map(continent => (
                <Button
                  key={continent}
                  variant={selectedContinent === continent ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedContinent(continent)}
                >
                  {continent === 'all' ? 'All Continents' : continent}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 border-l pl-4">
              {(COST_RANGES || []).map(range => (
                <Button
                  key={range.key}
                  variant={costFilter === range.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCostFilter(range.key)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="text-gray-600">
            {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'} found
          </div>
        </div>

        {/* Cities Grid */}
        {filteredCities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredCities || []).map(city => {
              const costLevel = getCostLevel(city.averageCost);
              return (
                <Card key={city.id} className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <div className="relative">
                    <div className="h-48 overflow-hidden">
                      <ImageWithFallback
                        src={city.image}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <Badge className={costLevel.color}>
                        {costLevel.label}
                      </Badge>
                    </div>
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{city.name}</h3>
                            <p className="text-sm text-gray-600">{city.country}</p>
                          </div>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="ml-1 text-sm font-semibold">{city.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <p className="text-gray-600 text-sm">{city.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Average daily cost:</span>
                          <span className="font-semibold">${city.averageCost}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Cost index:</span>
                          <span className="font-semibold">{city.costIndex}/100</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Popular activities:</p>
                        <div className="flex flex-wrap gap-1">
                          {(city.popularActivities || []).map(activity => (
                            <Badge key={activity} variant="secondary" className="text-xs">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/search/activities')}>
                          <Search className="w-4 h-4 mr-1" />
                          Activities
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => navigate('/create-trip')}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add to Trip
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cities found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery || selectedContinent !== 'all' || costFilter !== 'all' 
                ? 'Try adjusting your search criteria or explore our recommended destinations.'
                : 'Cities are loading... Please wait a moment.'
              }
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSelectedContinent('all');
              setCostFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}