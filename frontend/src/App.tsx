import React, { useState } from 'react';
import { login as apiLogin, signup as apiSignup, getTrips } from './utils/api';
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



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (email: string, password: string) => {
    setCurrentUser({
      id: '1',
      name: 'Varad Vekariya',
      email: email,
      avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQE4iAklqcnVEA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1725693994480?e=1757548800&v=beta&t=_7JtktwgnzaZBX5-oZBnuS000YjdfbXDvPQ8Ds8oUjY'
    });
    setIsAuthenticated(true);
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await apiSignup({ name, email, password });
      setToken(res.token);
      // Combine first_name and last_name for frontend User type
      const user = {
        ...res.user,
        name: [res.user.first_name, res.user.last_name].filter(Boolean).join(' ')
      };
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Fetch trips after signup
      const tripsRes = await getTrips(res.token);
      setTrips(tripsRes.trips || []);
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
  const updateTrip = (tripId: string, updates: Partial<Trip>) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId ? { ...trip, ...updates } : trip
    ));
  };
  const deleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== tripId));
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
          <Route path="/profile" element={<ProfileScreen user={currentUser!} onUpdateUser={setCurrentUser} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;