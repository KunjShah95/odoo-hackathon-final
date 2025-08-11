/// <reference types="vite/client" />
const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function signup(data: { name: string; email: string; password: string }) {
  // Split name into first_name and last_name (if possible)
  const [first_name, ...rest] = data.name.trim().split(' ');
  const last_name = rest.join(' ');
  const payload = {
    first_name,
    last_name,
    email: data.email,
    password: data.password,
    phone: '',
    city: '',
    country: '',
    additional_info: '',
    photo_url: ''
  };
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Signup failed');
  return res.json();
}

export async function getTrips(token: string) {
  const res = await fetch(`${API_URL}/trips`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
}

// Add more API helpers as needed (createTrip, etc.)
