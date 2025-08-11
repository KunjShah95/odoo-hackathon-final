import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createActivityApi } from '../services/api'
import toast from 'react-hot-toast'

export default function AddActivity() {
  const { stopId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '',
    cost: '',
    duration_minutes: '',
    images_url: '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createActivityApi(stopId, {
        ...form,
        cost: form.cost ? Number(form.cost) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      })
      toast.success('Activity added')
      navigate(-1)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Activity</h1>
      <form onSubmit={onSubmit} className="space-y-3 bg-white rounded-xl shadow p-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <input name="type" value={form.type} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Cost</label>
            <input type="number" step="0.01" name="cost" value={form.cost} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Duration (minutes)</label>
            <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Image URL</label>
          <input name="images_url" value={form.images_url} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-primary text-white rounded-md px-4 py-2">{loading ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={() => navigate(-1)} className="text-slate-700 underline">Cancel</button>
        </div>
      </form>
    </div>
  )
}
