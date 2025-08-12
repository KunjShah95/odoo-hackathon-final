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
  if (!token) {
    console.warn('No auth token for PDF export');
    return '#';
  }
  return `${API_URL}/pdf-export/${tripId}?token=${token}`;
}

// ICS Export (public) - requires public key (from share API)
export function getTripICSUrl(publicKey: string) {
  return `${API_URL}/calendar/trip/${publicKey}.ics`;
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
  if (!res.ok) {
    try {
      const data = await res.json();
      const msg = data?.error || data?.message || 'Failed to invite collaborator';
      throw new Error(msg);
    } catch {
      throw new Error('Failed to invite collaborator');
    }
  }
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

export async function upsertTripBudget(tripId: string, data: { transport_cost?: number; stay_cost?: number; activity_cost?: number; meal_cost?: number }, token: string) {
  const res = await fetch(`${API_URL}/budgets/${tripId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to save budget');
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

// Activities
export async function getActivities(stopId: string | number, token: string) {
  const res = await fetch(`${API_URL}/activities/stop/${stopId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json();
}

export async function addActivity(stopId: string | number, data: { name: string; description?: string; type?: string; cost?: number; duration_minutes?: number; image_url?: string }, token: string) {
  const res = await fetch(`${API_URL}/activities/${stopId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add activity');
  return res.json();
}

export async function updateActivity(activityId: string | number, updates: any, token: string) {
  const res = await fetch(`${API_URL}/activities/${activityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update activity');
  return res.json();
}

export async function deleteActivityById(activityId: string | number, token: string) {
  const res = await fetch(`${API_URL}/activities/${activityId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete activity');
  return res.json();
}

// AI Suggestion via backend proxy
export async function aiSuggest(prompt: string, token: string) {
  const res = await fetch(`${API_URL}/ai/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('Failed to get AI suggestion');
  return res.json();
}

// Nearby places via backend proxy
export async function getNearbyPlaces(params: { lat: number; lon: number; radius?: number; limit?: number }, token: string) {
  const qp = new URLSearchParams({ lat: String(params.lat), lon: String(params.lon) });
  if (params.radius) qp.set('radius', String(params.radius));
  if (params.limit) qp.set('limit', String(params.limit));
  const res = await fetch(`${API_URL}/places/nearby?${qp.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch nearby places');
  return res.json();
}

// Public nearby (no auth) fallback
export async function getPublicNearbyPlaces(params: { lat: number; lon: number; radius?: number; limit?: number }) {
  const qp = new URLSearchParams({ lat: String(params.lat), lon: String(params.lon) });
  if (params.radius) qp.set('radius', String(params.radius));
  if (params.limit) qp.set('limit', String(params.limit));
  const res = await fetch(`${API_URL}/places/public-nearby?${qp.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch public nearby places');
  return res.json();
}

// Wikipedia summary (no auth required)
export async function getWikiSummary(title: string) {
  const res = await fetch(`${API_URL}/integrations/wiki/summary?title=${encodeURIComponent(title)}`);
  if (!res.ok) return null;
  return res.json();
}

// Wikipedia search (top result) for fallback image/title
export async function searchWiki(query: string) {
  const res = await fetch(`${API_URL}/integrations/wiki/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  return res.json();
}

// Generic search helpers
export async function searchCities(q: string) {
  const res = await fetch(`${API_URL}/search/cities?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed city search');
  return res.json();
}

export async function searchTrips(q: string, token?: string, userId?: string | number) {
  const qp = new URLSearchParams({ q });
  if (userId) qp.set('userId', String(userId));
  const res = await fetch(`${API_URL}/search/trips?${qp.toString()}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new Error('Failed trip search');
  return res.json();
}

export async function searchActivities(q: string) {
  const res = await fetch(`${API_URL}/search/activities?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed activity search');
  return res.json();
}

export async function searchUsers(q: string) {
  const res = await fetch(`${API_URL}/search/users?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Failed user search');
  return res.json();
}

export async function searchPlaces(q: string, opts: { lat?: number; lon?: number; radius?: number; limit?: number } = {}) {
  const qp = new URLSearchParams({ q });
  if (opts.lat) qp.set('lat', String(opts.lat));
  if (opts.lon) qp.set('lon', String(opts.lon));
  if (opts.radius) qp.set('radius', String(opts.radius));
  if (opts.limit) qp.set('limit', String(opts.limit));
  const res = await fetch(`${API_URL}/search/places?${qp.toString()}`);
  if (!res.ok) throw new Error('Failed place search');
  return res.json();
}

export async function fetchImages(query: string) {
  const res = await fetch(`${API_URL}/integrations/images?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed image search');
  return res.json();
}

// Profile update
export async function updateProfile(updates: any) {
  const token = localStorage.getItem('token');
  if(!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_URL}/auth/profile`, { method:'PUT', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(updates) });
  if(!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

// Currency convert helper
export async function convertCurrency(amount:number, base:string, targets:string[]){
  const token = localStorage.getItem('token');
  if(!token) throw new Error('Not authenticated');
  const qp = new URLSearchParams({ amount:String(amount), base, targets: targets.join(',') });
  const res = await fetch(`${API_URL}/currency/convert?${qp.toString()}`, { headers: { Authorization:`Bearer ${token}` }});
  if(!res.ok) throw new Error('Failed to convert currency');
  return res.json();
}

// Expenses basic CRUD (owner only currently)
export async function getExpenses(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/expenses/${tripId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to load expenses');
  return res.json();
}
export async function addExpense(tripId: string, data: { category:string; amount:number; currency?:string; description?:string; date?:string }, token: string) {
  const res = await fetch(`${API_URL}/expenses/${tripId}`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
  if (!res.ok) {
    try {
      const err = await res.json();
      const msg = err?.error || err?.message || 'Failed to add expense';
      throw new Error(msg);
    } catch {
      throw new Error('Failed to add expense');
    }
  }
  return res.json();
}
export async function deleteExpense(expenseId: number, token: string) {
  const res = await fetch(`${API_URL}/expenses/${expenseId}`, { method:'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to delete expense');
  return res.json();
}

// Collaboration persistent messages

// Admin APIs
export async function adminBootstrap() {
  const res = await fetch(`${API_URL}/admin/bootstrap`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed admin bootstrap');
  return res.json();
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/admin/login`, { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('Admin login failed');
  return res.json();
}

export async function adminSeed(token: string) {
  const res = await fetch(`${API_URL}/admin/seed`, { method:'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Admin seed failed');
  return res.json();
}

export async function adminAnalytics(token: string) {
  const res = await fetch(`${API_URL}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Admin analytics failed');
  return res.json();
}
export async function getCollabMessages(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/collab/${tripId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}
export async function postCollabMessage(tripId: string, text: string, token: string) {
  const res = await fetch(`${API_URL}/collab/${tripId}/messages`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text }) });
  if (!res.ok) throw new Error('Failed to post message');
  return res.json();
}

// Expense sharing
export async function setExpenseShares(expenseId: number|string, shares: { user_id: number; share_amount: number }[], token: string) {
  const res = await fetch(`${API_URL}/expense-sharing/${expenseId}/shares`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ shares }) });
  if (!res.ok) throw new Error('Failed to set shares');
  return res.json();
}
export async function getTripSettlement(tripId: string, token: string) {
  const res = await fetch(`${API_URL}/expense-sharing/trip/${tripId}/settlement`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to get settlement');
  return res.json();
}
