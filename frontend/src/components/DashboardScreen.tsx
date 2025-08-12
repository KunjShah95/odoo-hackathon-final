import React, { useState, useEffect, useMemo } from 'react';
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
  Globe,
  Bell
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { User, Trip, NotificationItem } from '../types';
import { POPULAR_DESTINATIONS } from '../constants';
import { getTripStatus, getStatusColor } from '../utils';
import SmartSuggestions from './SmartSuggestions';
import BadgesPanel from './BadgesPanel';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import NotificationCenter from './NotificationCenter';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import DashboardCalendar from '@components/DashboardCalendar';

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

const StatCard = ({ icon, label, value, color, onClick }) => (
  <button onClick={onClick} className="text-left rounded-2xl shadow-sm border border-border bg-card p-6 flex items-center gap-5 group hover:bg-muted/50 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
    <div className={`w-14 h-14 bg-${color}-100 rounded-xl flex items-center justify-center text-${color}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  </button>
);

export default function DashboardScreen({ user, trips = [], onLogout }: DashboardScreenProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetTotals, setBudgetTotals] = useState<{ total: number; byTrip: Record<string, number> }>({ total: 0, byTrip: {} });

  // Compute budget totals from trips (kept simple and aligned with BudgetScreen totalCost)
  useEffect(() => {
    const byTrip: Record<string, number> = {};
    (trips || []).forEach(t => { byTrip[t.id] = Number(t.totalCost) || 0; });
    const total = Object.values(byTrip).reduce((a, b) => a + b, 0);
    setBudgetTotals({ total, byTrip });
  }, [trips]);

  // Derive smart local notifications (client heuristic) for hackathon demo
  const heuristicNotifs = useMemo<NotificationItem[]>(() => {
    const now = new Date();
    const list: NotificationItem[] = [];
    // Upcoming trips within 7 days
    (trips || []).forEach(t => {
      const start = new Date(t.startDate);
      const diffDays = (start.getTime() - now.getTime()) / 86400000;
      if (diffDays > 0 && diffDays <= 7) {
        list.push({
          id: `upcoming-${t.id}`,
            type: 'trip',
            title: 'Upcoming Trip Soon',
            message: `${t.name} starts in ${Math.ceil(diffDays)} day${Math.ceil(diffDays) === 1 ? '' : 's'}. Time to finalize your packing list!`,
            createdAt: now.toISOString(),
            severity: 'info',
            tripId: t.id,
        });
      }
    });
    // Suggest sharing if many public trips
    const publicCount = (trips || []).filter(t => t.isPublic).length;
    if (publicCount >= 3) {
      list.push({
        id: 'share-hint',
        type: 'suggestion',
        title: 'Boost Your Visibility',
        message: 'You have several public trips. Create a Public Trip Board to showcase them!',
        createdAt: now.toISOString(),
        severity: 'success'
      });
    }
    if ((trips || []).length === 0) {
      list.push({
        id: 'first-trip',
        type: 'trip',
        title: 'Start Your First Adventure',
        message: 'Create your first trip to unlock personalized AI suggestions and badges.',
        createdAt: now.toISOString(),
        severity: 'info'
      });
    }
    return list;
  }, [trips]);

  // Merge server notifications when fetched
  useEffect(() => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const merged = [...prev];
      heuristicNotifs.forEach(h => { if (!existingIds.has(h.id)) merged.push(h); });
      return merged;
    });
  }, [heuristicNotifs]);

  const upcomingTrips = (trips || []).filter(trip => new Date(trip.startDate) > new Date()).slice(0, 3);
  const recentTrips = (trips || []).slice(0, 3);
  const fallbackTotalBudget = (trips || []).reduce((sum, trip) => sum + (Number(trip.totalCost) || 0), 0);

  const handleCreateFromTemplate = (template: typeof TRIP_TEMPLATES[0]) => {
    // Navigate to create trip with pre-filled data
    navigate('/create-trip', { state: { template } });
  };

  const fetchServerNotifications = async () => {
    if (!user) return;
    setNotifLoading(true);
    setNotifError(null);
    try {
      const token = (user as any).token || localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      const data = await import('../utils/api').then(m => m.getNotifications(token));
      // Assume backend returns array; map to NotificationItem shape if needed
      const mapped: NotificationItem[] = (Array.isArray(data) ? data : []).map((d: any, idx: number) => ({
        id: d.id?.toString() || `srv-${idx}`,
        type: d.type || 'system',
        title: d.title || d.heading || 'Notification',
        message: d.message || d.body || 'Update available',
        createdAt: d.createdAt || d.created_at || new Date().toISOString(),
        read: d.read || false,
        tripId: d.tripId || d.trip_id,
        severity: d.severity || 'info'
      }));
      setNotifications(prev => {
        const ids = new Set(prev.map(p => p.id));
        const merged = [...prev];
        mapped.forEach(m => { if (!ids.has(m.id)) merged.push(m); });
        return merged;
      });
    } catch (e: any) {
      setNotifError(e.message || 'Failed to fetch notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    const open = !showNotifications;
    setShowNotifications(open);
    if (open) {
      fetchServerNotifications();
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const handleMarkAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
    
      return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 border-b border-border sticky top-0 z-40 shadow-sm backdrop-blur-lg animate-fade-in-down">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">GlobeTrotter</h1>
            </div>

            {/* Centered Navigation */}
            <nav className="hidden md:flex items-center space-x-2 bg-muted p-2 rounded-full">
              <Button variant={activeTab === 'overview' ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab('overview')}>Overview</Button>
              <Button variant={activeTab === 'templates' ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab('templates')}>Templates</Button>
              <Button variant={activeTab === 'explore' ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab('explore')}>Explore</Button>
              <Button variant={activeTab === 'recent' ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab('recent')}>Recent</Button>
            </nav>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/search/cities')} className="hidden sm:flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <div className="flex items-center space-x-3">
                <Popover open={showNotifications} onOpenChange={handleToggleNotifications}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full w-10 h-10">
                      <Bell className="w-5 h-5" />
                      {notifications.some(n => !n.read) && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full border-2 border-card" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-96">
                    <NotificationCenter
                      notifications={notifications.sort((a,b)=> (a.read?1:0)-(b.read?1:0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                      onMarkRead={handleMarkRead}
                      onMarkAll={handleMarkAll}
                      loading={notifLoading}
                      error={notifError}
                    />
                  </PopoverContent>
                </Popover>

                <div className="hidden sm:flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" onClick={() => navigate('/profile')}>
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" onClick={onLogout}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>

                <Avatar className="w-10 h-10 border-2 border-transparent hover:border-primary transition-colors">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {(user?.name || 'U').split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Mobile menu button */}
                <div className="sm:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" onClick={() => navigate('/profile')}>
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section FIRST */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
            Welcome back, {(user?.name || 'User').split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Ready to plan your next adventure? Here's a quick overview of your trips.</p>
        </div>

        <div className="my-8">
          <SmartSuggestions trips={trips} />
        </div>
        <div className="my-8">
          <BadgesPanel />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={<MapPin className="w-7 h-7" />} label="Total Trips" value={(trips || []).length} color="blue" onClick={() => navigate('/trips')} />
          <StatCard icon={<DollarSign className="w-7 h-7" />} label="Total Budget" value={`$${(budgetTotals.total || fallbackTotalBudget).toLocaleString()}`} color="green" onClick={() => setShowBudgetDialog(true)} />
          <StatCard icon={<Calendar className="w-7 h-7" />} label="Upcoming" value={upcomingTrips.length} color="purple" />
          <StatCard icon={<Users className="w-7 h-7" />} label="Shared" value={(trips || []).filter(t => t.isPublic).length} color="orange" />
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-full bg-muted p-1 md:hidden">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 animate-fade-in-down">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg border-0 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Actions</CardTitle>
                    <CardDescription>Start your next adventure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start"
                      onClick={() => navigate('/create-trip')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Plan New Trip
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => navigate('/trips')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      My Trips
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => navigate('/search/cities')}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Explore Cities
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => navigate('/search/activities')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Find Activities
                    </Button>
                    <Button 
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => navigate('/public-boards')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Public Boards
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Trips as Calendar */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Upcoming Trips</CardTitle>
                      <CardDescription>Your upcoming adventures at a glance</CardDescription>
                    </div>
                    <Link to="/trips"><Button variant="ghost" size="sm">View All</Button></Link>
                  </CardHeader>
                  <CardContent>
                    <DashboardCalendar trips={trips || []} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6 animate-fade-in-down">
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Trip Templates</CardTitle>
                <CardDescription>Get started quickly with our pre-designed itineraries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(TRIP_TEMPLATES || []).map(template => (
                    <Card key={template.id} className="group hover:shadow-xl transition-shadow cursor-pointer rounded-2xl overflow-hidden border-0">
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={template.image}
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary">{template.difficulty}</Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-5">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {template.duration}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {template.cities.length} cities
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3">
                            <span className="font-bold text-lg text-primary">${template.estimatedCost}</span>
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
          <TabsContent value="explore" className="space-y-6 animate-fade-in-down">
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Popular Destinations</CardTitle>
                <CardDescription>Trending places to visit, suggested for you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(POPULAR_DESTINATIONS || []).map(destination => (
                    <div 
                      key={destination.name}
                      className="relative group cursor-pointer rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
                      onClick={() => navigate('/search/cities')}
                    >
                      <ImageWithFallback
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <h4 className="font-semibold text-base sm:text-lg">{destination.name}</h4>
                        <p className="text-xs sm:text-sm opacity-90">{destination.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-6 animate-fade-in-down">
            <Card className="shadow-lg border-0 rounded-2xl">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest trip planning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentTrips || []).map(trip => (
                    <div key={trip.id} className="flex items-center space-x-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{trip.name}</h4>
                        <p className="text-sm text-muted-foreground">Last updated: {new Date(trip.startDate).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/trip/${trip.id}/view`)}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Budget Dialog */}
        <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Budgets by Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-72 overflow-auto">
              {(trips || []).map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>${((budgetTotals.byTrip[t.id] ?? Number(t.totalCost)) || 0).toLocaleString()}</Badge>
                    <Button size="sm" onClick={() => navigate(`/trip/${t.id}/budget`)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}