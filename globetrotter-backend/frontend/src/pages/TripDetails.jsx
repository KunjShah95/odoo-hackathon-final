import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function TripDetails() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api
      .get(`/trips/${tripId}/details`)
      .then(({ data }) => mounted && setDetails(data))
      .catch((err) => toast.error(err?.response?.data?.error || 'Failed to load trip'))
      .finally(() => mounted && setLoading(false))
    return () => (mounted = false)
  }, [tripId])

  if (loading) return <div className="p-6">Loading…</div>
  if (!details) return (
    <div className="p-6">
      <p className="text-slate-600">Trip not found.</p>
      <button onClick={() => navigate(-1)} className="text-primary underline mt-2">Go back</button>
    </div>
  )

  const { trip, stops } = details

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{trip.name}</h1>
          <p className="text-sm text-slate-600">{new Date(trip.start_date).toLocaleDateString()} → {new Date(trip.end_date).toLocaleDateString()}</p>
        </div>
        <Link to={`/app/trips/${trip.id}/add-stop`} className="bg-primary text-white rounded-md px-4 py-2">Add stop</Link>
      </header>
      <p className="text-slate-700 mb-6">{trip.description || '—'}</p>

      <section className="space-y-4">
        {stops.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-slate-600">No stops yet. Add your first stop.</p>
          </div>
        ) : (
          stops.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{s.city_name}, {s.country_name}</h3>
                  <p className="text-sm text-slate-600">{new Date(s.start_date).toLocaleDateString()} → {new Date(s.end_date).toLocaleDateString()}</p>
                </div>
                <Link to={`/app/stops/${s.id}/add-activity`} className="text-primary underline">Add activity</Link>
              </div>
              {s.activities?.length ? (
                <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {s.activities.map((a) => (
                    <li key={a.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{a.name}</span>
                        {a.type && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{a.type}</span>}
                      </div>
                      {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
                      <div className="text-xs text-slate-500 mt-2 flex gap-4">
                        {a.cost != null && <span>Cost: ${a.cost}</span>}
                        {a.duration_minutes != null && <span>Duration: {a.duration_minutes}m</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 mt-3">No activities yet.</p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}
