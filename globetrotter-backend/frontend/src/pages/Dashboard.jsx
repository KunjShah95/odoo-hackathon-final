import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createTripApi, getTripsApi } from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../state/AuthContext'

export default function Dashboard() {
  const { logout } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' })

  useEffect(() => {
    let mounted = true
    getTripsApi()
      .then((data) => mounted && setTrips(data))
      .catch((err) => toast.error(err?.response?.data?.error || 'Failed to load trips'))
      .finally(() => mounted && setLoading(false))
    return () => (mounted = false)
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const createTrip = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const trip = await createTripApi(form)
      setTrips((t) => [trip, ...t])
      setForm({ name: '', description: '', start_date: '', end_date: '' })
      toast.success('Trip created')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Trips</h1>
        <button onClick={logout} className="text-red-600 hover:underline">Logout</button>
      </header>

      <section className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-medium mb-3">Create a new trip</h2>
        <form onSubmit={createTrip} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border rounded-md px-3 py-2" />
          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border rounded-md px-3 py-2 md:col-span-2" />
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required className="border rounded-md px-3 py-2" />
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required className="border rounded-md px-3 py-2" />
          <button type="submit" disabled={creating} className="bg-primary text-white rounded-md px-4 py-2 md:col-span-5 md:w-max">{creating ? 'Creating…' : 'Add trip'}</button>
        </form>
      </section>

      {loading ? (
        <p>Loading…</p>
      ) : trips.length === 0 ? (
        <p className="text-slate-600">No trips yet. Create your first one above.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.map((t) => (
            <Link key={t.id} to={`/app/trips/${t.id}`} className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{new Date(t.start_date).toLocaleDateString()} → {new Date(t.end_date).toLocaleDateString()}</span>
              </div>
              {t.description && <p className="text-slate-600 mt-2 line-clamp-2">{t.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
