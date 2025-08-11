import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import TripDetails from './pages/TripDetails'
import AddStop from './pages/AddStop'
import AddActivity from './pages/AddActivity'
import { AuthProvider, useAuth } from './state/AuthContext'
import Company from './pages/Company'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-slate-800">
        <Routes>
          {/* Public landing */}
          <Route path="/" element={<Company />} />
          <Route path="/company" element={<Company />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* App (protected) */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/app/trips/:tripId"
            element={
              <PrivateRoute>
                <TripDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/app/trips/:tripId/add-stop"
            element={
              <PrivateRoute>
                <AddStop />
              </PrivateRoute>
            }
          />
          <Route
            path="/app/stops/:stopId/add-activity"
            element={
              <PrivateRoute>
                <AddActivity />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}
