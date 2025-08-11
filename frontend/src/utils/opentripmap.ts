// Utility to fetch popular places from OpenTripMap (free tier)
// Docs: https://opentripmap.io/docs

const OPENTRIPMAP_API_KEY = '5ae2e3f221c38a28845f05b6'; // Demo key, replace with your own for production
const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

// Basic direct geocoding using OpenTripMap autosuggest endpoint
export async function geocodeCity(name: string) {
  if (!name) return null;
  const url = `${BASE_URL}/autosuggest?name=${encodeURIComponent(name)}&radius=0&format=json&limit=1&apikey=${OPENTRIPMAP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const item = data[0];
    return { lat: item.point?.lat, lon: item.point?.lon, name: item.name || name };
  }
  return null;
}

export async function fetchPopularPlaces({lon = 0, lat = 0, radius = 10000, limit = 5} = {}) {
  // Default: fetch popular places near London
  const url = `${BASE_URL}/radius?radius=${radius}&lon=${lon}&lat=${lat}&rate=3&format=json&limit=${limit}&apikey=${OPENTRIPMAP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch places');
  return res.json();
}

export async function fetchPlaceDetails(xid: string) {
  const url = `${BASE_URL}/xid/${xid}?apikey=${OPENTRIPMAP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch place details');
  return res.json();
}
