import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Calendar, Camera, Plane, Clock, DollarSign, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { User, Trip } from '../types';
import { INSPIRATION_PHRASES } from '../constants';

interface CreateTripScreenProps {
  user?: User;
  onAddTrip: (trip: Trip) => void;
}

export default function CreateTripScreen({ user, onAddTrip }: CreateTripScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template;

  const [tripName, setTripName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Pre-fill form if template is provided
  useEffect(() => {
    if (template) {
      setTripName(template.name);
      setDescription(template.description);
      setCoverPhoto(template.image);
      
      // Set dates starting from today
      const today = new Date();
      const startDateStr = today.toISOString().split('T')[0];
      setStartDate(startDateStr);
      
      // Calculate end date based on template duration
      const durationMatch = template.duration.match(/(\d+)/);
      if (durationMatch) {
        const duration = parseInt(durationMatch[1]);
        const endDateObj = new Date(today);
        endDateObj.setDate(endDateObj.getDate() + duration);
        setEndDate(endDateObj.toISOString().split('T')[0]);
      }
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    const newErrors: {[key: string]: string} = {};
    if (!tripName.trim()) newErrors.tripName = 'Trip name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    const newTrip: Trip = {
      id: Date.now().toString(),
      name: tripName.trim(),
      description: description.trim(),
      startDate,
      endDate,
      coverPhoto: coverPhoto || undefined,
      cities: template ? (template.cities || []) : [],
      totalCost: template ? template.estimatedCost : 0,
      isPublic: false
    };

    // Simulate API call
    setTimeout(() => {
      onAddTrip(newTrip);
      setIsLoading(false);
      navigate(`/trip/${newTrip.id}/build`);
    }, 1000);
  };

  const clearTemplate = () => {
    setTripName('');
    setDescription('');
    setCoverPhoto('');
    setStartDate('');
    setEndDate('');
    navigate('/create-trip', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold">Create New Trip</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Template Banner */}
        {template && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Using Template: {template.name}</h3>
                    <p className="text-sm text-blue-600">Pre-filled with suggested cities and itinerary</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={clearTemplate}>
                  Clear Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Trip Details
                </CardTitle>
                <CardDescription>
                  Tell us about your upcoming adventure
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="tripName">Trip Name *</Label>
                    <Input
                      id="tripName"
                      placeholder="e.g., European Adventure, Asian Discovery"
                      value={tripName}
                      onChange={(e) => setTripName(e.target.value)}
                      className={errors.tripName ? 'border-red-500' : ''}
                    />
                    {errors.tripName && (
                      <p className="text-sm text-red-600">{errors.tripName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what makes this trip special..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Start Date *
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={errors.startDate ? 'border-red-500' : ''}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-600">{errors.startDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        End Date *
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                      {errors.endDate && (
                        <p className="text-sm text-red-600">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverPhoto" className="flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      Cover Photo URL (Optional)
                    </Label>
                    <Input
                      id="coverPhoto"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={coverPhoto}
                      onChange={(e) => setCoverPhoto(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Add a beautiful cover photo for your trip
                    </p>
                  </div>

                  {/* Template Preview */}
                  {template && (
                    <div className="space-y-3">
                      <Label>Template Preview</Label>
                      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{template.duration}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">${template.estimatedCost}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Included Cities:</p>
                          <div className="flex flex-wrap gap-1">
                            {(template.cities || []).map((city: string) => (
                              <Badge key={city} variant="secondary" className="text-xs">
                                {city}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Trip...' : 'Create Trip & Start Planning'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/dashboard')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Inspiration & Guide */}
          <div className="space-y-6">
            {/* Cover Photo Preview */}
            {coverPhoto && (
              <Card>
                <CardHeader>
                  <CardTitle>Cover Photo Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={coverPhoto}
                      alt="Trip cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Travel Inspiration */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">✨ Travel Inspiration</CardTitle>
                <CardDescription className="text-blue-600">
                  Get inspired for your next adventure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(INSPIRATION_PHRASES || []).length > 0 ? (
                    (INSPIRATION_PHRASES || []).map((phrase, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-blue-800 italic text-sm sm:text-base">{phrase}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="text-blue-800 italic text-sm sm:text-base">✈️ Adventure awaits...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Planning Guide */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
                <CardDescription>After creating your trip</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Add Cities</h4>
                      <p className="text-sm text-gray-600">Search and add destinations to your itinerary</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Plan Activities</h4>
                      <p className="text-sm text-gray-600">Discover amazing things to do in each city</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Track Budget</h4>
                      <p className="text-sm text-gray-600">Monitor costs and stay within budget</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Share & Collaborate</h4>
                      <p className="text-sm text-gray-600">Share your itinerary with friends and family</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}