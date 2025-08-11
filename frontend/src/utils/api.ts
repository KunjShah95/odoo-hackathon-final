// Utility mappers
interface RawTripRow {
  id: number; name: string; description?: string; start_date?: string; end_date?: string; cover_photo?: string; is_public?: boolean; total_cost?: number;
}

export function mapTrip(row: RawTripRow) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    startDate: row.start_date || new Date().toISOString(),
    endDate: row.end_date || new Date().toISOString(),
    coverPhoto: row.cover_photo || undefined,
    isPublic: !!row.is_public,
    totalCost: row.total_cost ?? 0,
    cities: [] as string[],
  };
}

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

// Notifications (normalize to array of simple objects for dashboard)
export async function getNotifications(token: string) {
  const res = await fetch(`${API_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  if (Array.isArray(data)) return data; // already array
  if (data && Array.isArray(data.invites)) {
    return data.invites.map((inv: any) => ({
      id: `invite-${inv.id}`,
      type: 'collaboration',
      title: 'Trip Collaboration',
      message: `You are a ${inv.role} on ${inv.trip?.name || 'a trip'}`,
      createdAt: inv.created_at,
      read: false,
      severity: 'info',
      tripId: inv.trip_id
    }));
  }
  return [];
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
  const data = await res.json();
  return data.map((c: any) => ({
    id: c.id,
    role: c.role,
    created_at: c.created_at,
    user: {
      id: c.user.id,
      first_name: c.user.first_name,
      last_name: c.user.last_name,
      email: c.user.email
    }
  }));
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
  const [first_name, ...rest] = data.name.trim().split(' ');
  const last_name = rest.join(' ');
  const payload = { first_name, last_name, email: data.email, password: data.password };
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Signup failed');
  return res.json(); // no token returned; caller should login after
}

export async function getTrips(token: string) {
  const res = await fetch(`${API_URL}/trips`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch trips');
  const data = await res.json();
  if (Array.isArray(data)) return data.map(mapTrip);
  return [];
}


export async function getTripBudget(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/budgets/${tripId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch budget');
  return res.json();
}

// Update trip partial (expects camelCase input)
export async function updateTrip(tripId: string, updates: any, token: string) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.coverPhoto !== undefined) payload.cover_photo = updates.coverPhoto;
  if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
  const res = await fetch(`${API_URL}/trips/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update trip');
  const row = await res.json();
  return mapTrip(row);
}

// Stops persistence
export interface StopInput {
  city_name: string;
  country_name?: string;
  start_date?: string;
  end_date?: string;
  order_index?: number;
}

export async function getStops(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/stops/${tripId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch stops');
  return res.json();
}

export async function createStop(tripId: string, stop: StopInput, token: string) {
  const res = await fetch(`${API_URL}/stops/${tripId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(stop)
  });
  if (!res.ok) throw new Error('Failed to create stop');
  return res.json();
}

export async function deleteStop(stopId: number, token: string) {
  const res = await fetch(`${API_URL}/stops/${stopId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete stop');
  return res.json();
}

export async function reorderStops(tripId: string, ordered: { stopId: number; order_index: number }[], token: string) {
  const res = await fetch(`${API_URL}/stops/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ tripId, order: ordered })
  });
  if (!res.ok) throw new Error('Failed to reorder stops');
  return res.json();
}
