// Frontend geocoding helper that calls backend Nominatim proxy
export async function geocodeCity(name: string) {
  const token = localStorage.getItem('token');
  if (!name || !token) return null;
  // Vite env
  const API_URL: string = (import.meta as any).env.VITE_API_URL;
  if (!API_URL) {
    console.error('VITE_API_URL not configured');
    return null;
  }
  const url = `${API_URL}/geo/forward?city=${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.warn(`Geocoding failed for ${name}: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
      return { lat: data.lat, lon: data.lon, name: data.name || name };
    }
    return null;
  } catch (error) {
    console.error(`Geocoding error for ${name}:`, error);
    return null;
  }
}
