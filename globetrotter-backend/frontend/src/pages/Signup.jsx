import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerApi } from '../services/api'
import toast from 'react-hot-toast'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: '',
    additional_info: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await registerApi(form)
      toast.success('Account created. Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold text-dark mb-6">Create your account</h1>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">First name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm mb-1">Last name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm mb-1">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm mb-1">Country</label>
            <input name="country" value={form.country} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Additional info</label>
            <textarea name="additional_info" value={form.additional_info} onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary" />
          </div>

          <div className="md:col-span-2 flex gap-3 mt-2">
            <button type="submit" disabled={loading} className="bg-primary text-white rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-60">{loading ? 'Creating…' : 'Sign up'}</button>
            <Link to="/login" className="text-primary underline self-center">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
