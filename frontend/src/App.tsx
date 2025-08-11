import React, { useState } from 'react';
import { login as apiLogin, signup as apiSignup, getTrips, updateTrip as apiUpdateTrip } from './utils/api';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Trip } from './types';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import DashboardScreen from './components/DashboardScreen';
import CreateTripScreen from './components/CreateTripScreen';
import MyTripsScreen from './components/MyTripsScreen';
import ItineraryBuilderScreen from './components/ItineraryBuilderScreen';
import ItineraryViewScreen from './components/ItineraryViewScreen';
import CitySearchScreen from './components/CitySearchScreen';
import ActivitySearchScreen from './components/ActivitySearchScreen';
import BudgetScreen from './components/BudgetScreen';
import CalendarScreen from './components/CalendarScreen';
import SharedItineraryScreen from './components/SharedItineraryScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminPanel from './components/AdminPanel';
import PublicTripBoards from './components/PublicTripBoards';



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      const tokenVal = res.token;
      setToken(tokenVal);
      localStorage.setItem('token', tokenVal);
      const user = {
        id: String(res.user.id),
        name: [res.user.first_name, res.user.last_name].filter(Boolean).join(' '),
        email: res.user.email,
        avatar: res.user.photo_url || undefined,
        currency_preference: res.user.currency_preference
      } as any; // adapt to User type
      setCurrentUser(user);
      const tripsData = await getTrips(tokenVal);
      setTrips(tripsData);
      setIsAuthenticated(true);
    } catch (e: any) {
      setAuthError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      await apiSignup({ name, email, password });
      // auto-login after signup
      await handleLogin(email, password);
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    setTrips([]);
  };

  const addTrip = (trip: Trip) => setTrips(prev => [...prev, trip]);
  const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
    setTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, ...updates } : trip)); // optimistic
    try {
      if (token) {
        const updated = await apiUpdateTrip(tripId, updates, token);
        setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...updated } : t));
      }
    } catch (e) {
      // revert? For now just log
      console.error('Failed to persist trip update', e);
    }
  };
  const deleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== tripId));
  };
  
  const handleUpdateUser = (user: User) => {
    setCurrentUser(user);
  };

  const cloneTrip = (trip: Trip) => {
    setTrips(prev => [...prev, trip]);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {loading && (
            <div className="fixed top-0 left-0 w-full bg-blue-100 text-blue-800 text-center py-2 z-50">Loading...</div>
          )}
          {authError && (
            <div className="text-center text-red-600 py-2">{authError}</div>
          )}
          <Routes>
            <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupScreen onSignup={handleSignup} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  const commonProps = { user: currentUser!, trips };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/dashboard" element={<DashboardScreen {...commonProps} onLogout={handleLogout} />} />
          <Route path="/create-trip" element={<CreateTripScreen user={currentUser!} onAddTrip={addTrip} />} />
          <Route path="/trips" element={<MyTripsScreen {...commonProps} onUpdateTrip={updateTrip} onDeleteTrip={deleteTrip} />} />
          <Route path="/trip/:tripId/build" element={<ItineraryBuilderScreen {...commonProps} onUpdateTrip={updateTrip} />} />
          <Route path="/trip/:tripId/view" element={<ItineraryViewScreen {...commonProps} />} />
          <Route path="/search/cities" element={<CitySearchScreen user={currentUser!} />} />
          <Route path="/search/activities" element={<ActivitySearchScreen user={currentUser!} />} />
          <Route path="/trip/:tripId/budget" element={<BudgetScreen {...commonProps} />} />
          <Route path="/trip/:tripId/calendar" element={<CalendarScreen {...commonProps} />} />
<Route path="/trip/:tripId/share" element={<SharedItineraryScreen trips={trips} />} />
<Route path="/public-boards" element={<PublicTripBoards user={currentUser!} trips={trips} onCloneTrip={cloneTrip} />} />
<Route path="/profile" element={<ProfileScreen user={currentUser!} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />} />
<Route path="/admin/*" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;