// Activity Suggestions
export async function getActivitySuggestion(city: string, token: string) {
  const res = await fetch(`${API_URL}/activity-suggestions/${encodeURIComponent(city)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch activity suggestion');
  return res.json();
}

// Weather
export async function getWeather(city: string, token: string) {
  const res = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
}

// PDF Export
export function getTripPDFUrl(tripId: string) {
  const token = localStorage.getItem('token');
  return `${API_URL}/pdf-export/${tripId}?token=${token}`;
}

// Notifications
export async function getNotifications(token: string) {
  const res = await fetch(`${API_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

// Analytics
export async function getTripAnalytics(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/analytics/trip/${tripId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}
// Collaborators API
export async function getCollaborators(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/collaborators/${tripId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch collaborators');
  return res.json();
}

export async function inviteCollaborator(tripId: string, email: string, role: string, token: string) {
  const res = await fetch(`${API_URL}/collaborators/${tripId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ email, role })
  });
  if (!res.ok) throw new Error('Failed to invite collaborator');
  return res.json();
}

export async function removeCollaborator(tripId: string, userId: string, token: string) {
  const res = await fetch(`${API_URL}/collaborators/${tripId}/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to remove collaborator');
  return res.json();
}

// Vite env type fix
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
const API_URL: string = ((import.meta as unknown) as ImportMeta).env.VITE_API_URL;

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


export async function getTripBudget(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/budgets/${tripId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch budget');
  return res.json();
}
