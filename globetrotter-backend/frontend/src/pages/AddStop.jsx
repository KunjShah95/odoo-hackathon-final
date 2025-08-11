import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createStopApi } from '../services/api'
import toast from 'react-hot-toast'

export default function AddStop() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    city_name: '',
    country_name: '',
    start_date: '',
    end_date: '',
    order_index: 0,
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createStopApi(tripId, { ...form, order_index: Number(form.order_index) })
      toast.success('Stop added')
      navigate(`/app/trips/${tripId}`)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add stop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Stop</h1>
      <form onSubmit={onSubmit} className="space-y-3 bg-white rounded-xl shadow p-4">
        <div>
          <label className="block text-sm mb-1">City</label>
          <input name="city_name" value={form.city_name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Country</label>
          <input name="country_name" value={form.country_name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Start date</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">End date</label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Order index</label>
          <input type="number" name="order_index" value={form.order_index} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-primary text-white rounded-md px-4 py-2">{loading ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={() => navigate(-1)} className="text-slate-700 underline">Cancel</button>
        </div>
      </form>
    </div>
  )
}
