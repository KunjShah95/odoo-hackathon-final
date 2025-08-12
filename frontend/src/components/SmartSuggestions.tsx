import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin, TrendingUp, Plus } from 'lucide-react';
import { getNearbyPlaces, getPublicNearbyPlaces, getWikiSummary, searchWiki, getStops, addActivity, fetchImages } from '../utils/api';
import { POPULAR_DESTINATIONS } from '../constants';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Trip } from '../types';

const DEFAULT_COORDS = { lat: 51.5074, lon: -0.1278 }; // London

interface SmartSuggestionsProps {
  trips?: Trip[];
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ trips = [] }) => {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Add-to-Trip dialog state
  const [open, setOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [stops, setStops] = useState<any[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  // Customization fields
  const [customName, setCustomName] = useState<string>('');
  const [customType, setCustomType] = useState<string>('poi');
  const [customCost, setCustomCost] = useState<string>('0');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [customImage, setCustomImage] = useState<string>('');
  const [showCustomize, setShowCustomize] = useState<boolean>(true);

  const tripsById = useMemo(() => {
    const m: Record<string, Trip> = {} as any;
    (trips || []).forEach(t => { m[t.id] = t as Trip; });
    return m;
  }, [trips]);

  // Geolocation first, then fetch
  useEffect(() => {
    let canceled = false;
    const resolveCoordsAndFetch = async () => {
      // Try browser geolocation (best effort with short timeout)
      const geo = await new Promise<{ lat: number; lon: number }>((resolve) => {
        if (!('geolocation' in navigator)) return resolve(DEFAULT_COORDS);
        let resolved = false;
        const tid = setTimeout(() => { if (!resolved) { resolved = true; resolve(DEFAULT_COORDS); } }, 4000);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (resolved) return; resolved = true; clearTimeout(tid);
            resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          },
          () => { if (resolved) return; resolved = true; clearTimeout(tid); resolve(DEFAULT_COORDS); },
          { enableHighAccuracy: false, timeout: 3500, maximumAge: 60_000 }
        );
      });
      if (!canceled) setCoords(geo);
      if (!canceled) await fetchData(geo);
    };

    resolveCoordsAndFetch();
    return () => { canceled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData(position: { lat: number; lon: number }) {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let details: any[] = [];
        try {
          if (token) {
            const nearby = await getNearbyPlaces({ ...position, radius: 15000, limit: 3 }, token);
            const items = (nearby.items || []).map((p: any) => ({ id: p.id, osmType: p.osmType, name: p.name, kinds: p.kinds, url: p.url, lat: p.lat, lon: p.lon }));
            details = items;
          } else {
            // no token: use public
            const nearby = await getPublicNearbyPlaces({ ...position, radius: 12000, limit: 3 });
            const items = (nearby.items || []).map((p: any) => ({ id: p.id, osmType: p.osmType, name: p.name, kinds: p.kinds, url: p.url, lat: p.lat, lon: p.lon }));
            details = items;
          }
        } catch (e) {
          // Auth path failed; attempt public fallback once
          if (!details.length) {
            try {
              const publicNearby = await getPublicNearbyPlaces({ ...position, radius: 12000, limit: 3 });
              const items = (publicNearby.items || []).map((p: any) => ({ id: p.id, osmType: p.osmType, name: p.name, kinds: p.kinds, url: p.url, lat: p.lat, lon: p.lon }));
              details = items;
            } catch {/* continue to Overpass inline fallback below */}
          }
          // Fallback: query Overpass API directly (no key) and normalize
          const qLat = position.lat;
          const qLon = position.lon;
          const qRadius = 20000;
          const overpassQuery = `
            [out:json][timeout:25];
            (
              node["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork|gallery"](around:${qRadius},${qLat},${qLon});
              way["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork|gallery"](around:${qRadius},${qLat},${qLon});
              relation["tourism"~"attraction|museum|viewpoint|zoo|theme_park|artwork|gallery"](around:${qRadius},${qLat},${qLon});
              node["amenity"~"park|theatre|arts_centre"](around:${qRadius},${qLat},${qLon});
            );
            out center 50;`;
          const r = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ data: overpassQuery })
          });
          if (!r.ok) throw new Error('Overpass fallback failed');
          const raw = await r.json();
          const elements = Array.isArray(raw.elements) ? raw.elements : [];
          details = elements
            .map((el: any) => {
              const tags = el.tags || {};
              const name = tags.name || tags['name:en'] || '';
              const lat = el.lat || el.center?.lat || null;
              const lon = el.lon || el.center?.lon || null;
              const kinds = [tags.tourism || '', tags.amenity || ''].filter(Boolean).join(',');
              const url = `https://www.openstreetmap.org/${el.type}/${el.id}`;
              return { id: String(el.id), osmType: el.type, name, lat, lon, kinds, url };
            })
            .filter((p: any) => p.name && p.lat && p.lon)
            .slice(0, 3);
        }
        // Best-effort: try to enrich with a Wikipedia thumbnail if title matches place name
        try {
      const enriched = await Promise.all(details.map(async (p: any) => {
            try {
              // First attempt: exact summary endpoint
              const w = await getWikiSummary(p.name);
              if (w && w.image) return { ...p, image: w.image, page: w?.page || null };
              // Fallback: search endpoint
              const s = await searchWiki(p.name);
        const img = s?.result?.image || null;
        const page = s?.result?.page || null;
              if (img) return { ...p, image: img, page };
              // Final fallback: Serp image search (best effort)
              try {
                const serp = await fetchImages(p.name + ' tourist attraction');
                const first = serp?.images?.[0]?.original || serp?.images?.[0]?.thumbnail || null;
                return { ...p, image: first, page };
              } catch { return { ...p, page }; }
            } catch { return p; }
          }));
          const list = Array.isArray(enriched) ? enriched : [];
          if (list.length === 0) {
            const fallback = (POPULAR_DESTINATIONS || []).slice(0, 3).map((d, idx) => ({
              id: `popular-${idx}-${d.name}`,
              name: d.name,
              kinds: 'Popular',
              image: d.image,
              url: `https://www.google.com/search?q=${encodeURIComponent(d.name + ' attraction')}`,
            }));
            setPlaces(fallback);
          } else {
            setPlaces(list);
          }
        } catch {
          const list = Array.isArray(details) ? details : [];
          if (list.length === 0) {
            const fallback = (POPULAR_DESTINATIONS || []).slice(0, 3).map((d, idx) => ({
              id: `popular-${idx}-${d.name}`,
              name: d.name,
              kinds: 'Popular',
              image: d.image,
              url: `https://www.google.com/search?q=${encodeURIComponent(d.name + ' attraction')}`,
            }));
            setPlaces(fallback);
          } else {
            setPlaces(list);
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load suggestions');
      } finally {
        setLoading(false);
      }
  }

  return (
    <Card className="shadow-md border-0 mb-8">
      <CardHeader>
        <CardTitle className="text-blue-900">Smart Suggestions for You</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white shadow animate-pulse">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex space-x-2 pt-2">
                    <div className="h-8 w-20 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            {error}
            <div className="mt-2 text-xs text-gray-500">Using fallback suggestions.</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {places.map(place => {
                const exploreUrl = place.url || place.page || (place.name ? `https://www.google.com/search?q=${encodeURIComponent(place.name + ' attraction')}` : '#');
                return (
                <div
                  key={place.id}
                  className="rounded-xl overflow-hidden bg-white shadow"
                >
                  {place.image ? (
                    <img
                      src={place.image}
                      alt={place.name}
                      loading="lazy"
                      className="w-full h-40 object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-gray-300 text-sm">Fetching image...</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="font-semibold text-lg text-blue-900">{place.name}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{(place.kinds || '').split(',')[0] || 'Interesting place'}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        disabled={!exploreUrl || exploreUrl==='#'}
                        onClick={() => { if (exploreUrl && exploreUrl !== '#') window.open(exploreUrl, '_blank', 'noopener'); }}
                        title={!exploreUrl || exploreUrl==='#' ? 'No link available' : 'Open details'}
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Explore
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        onClick={async () => {
                          if ((trips || []).length === 0) {
                            navigate('/create-trip');
                            return;
                          }
                          setSelectedPlace(place);
                          setOpen(true);
                          setSaveMsg(null);
                          // Prefill custom fields
                          setCustomName(place?.name || '');
                          setCustomType('poi');
                          setCustomCost('0');
                          setCustomDesc(`Suggested place added from Smart Suggestions. ${place.url ? 'More: ' + place.url : ''}`.trim());
                          setCustomImage(place?.image || '');
                          if ((trips || []).length > 0) {
                            const firstTripId = (trips || [])[0].id;
                            setSelectedTripId(firstTripId);
                            // preload stops and pick first automatically for faster flow
                            try {
                              const token = localStorage.getItem('token');
                              if (token) {
                                const s = await getStops(firstTripId, token);
                                const arr = Array.isArray(s) ? s : [];
                                setStops(arr);
                                if (arr.length) setSelectedStopId(String(arr[0].id));
                              }
                            } catch { /* ignore */ }
                          }
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        title={(trips || []).length === 0 ? 'Create a trip first' : 'Add to Trip'}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Trip
                      </Button>
                    </div>
                  </div>
                </div>
              );})}
            </div>
            {/* AI Creative Suggestion removed per request */}
          </>
        )}
      </CardContent>
      {/* Add-to-Trip dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add suggestion to your trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm mb-1">Select Trip</div>
              <Select value={selectedTripId} onValueChange={async (val) => {
                setSelectedTripId(val);
                setSelectedStopId('');
                setStops([]);
                try {
                  const token = localStorage.getItem('token');
                  if (!token) return;
                  const s = await getStops(val, token);
                  setStops(Array.isArray(s) ? s : []);
                } catch { /* noop */ }
              }}>
                <SelectTrigger className="w-full"><SelectValue placeholder={(trips || []).length ? 'Choose a trip' : 'No trips available'} /></SelectTrigger>
                <SelectContent>
                  {(trips || []).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">Select Stop (city)</div>
              <Select value={selectedStopId} onValueChange={setSelectedStopId}>
                <SelectTrigger className="w-full"><SelectValue placeholder={stops.length ? 'Choose a stop' : 'Load a trip first'} /></SelectTrigger>
                <SelectContent>
                  {stops.map((s: any) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.city_name || s.city || `Stop #${s.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Customize toggle */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Customize details</div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomize(v => !v)}>
                {showCustomize ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showCustomize && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Name</div>
                  <input className="w-full border rounded px-2 py-1" value={customName} onChange={e => setCustomName(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <input className="w-full border rounded px-2 py-1" value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g., poi, sight, food" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Estimated Cost</div>
                  <input className="w-full border rounded px-2 py-1" type="number" min="0" step="0.01" value={customCost} onChange={e => setCustomCost(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Image URL</div>
                  <input className="w-full border rounded px-2 py-1" value={customImage} onChange={e => setCustomImage(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-600 mb-1">Notes / Description</div>
                  <textarea className="w-full border rounded px-2 py-1 h-20" value={customDesc} onChange={e => setCustomDesc(e.target.value)} />
                </div>
              </div>
            )}
            {saveMsg && <div className="text-sm text-green-700">{saveMsg}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedTripId || !selectedStopId || !selectedPlace || saving}
              onClick={async () => {
                if (!selectedTripId || !selectedStopId || !selectedPlace) return;
                setSaving(true); setSaveMsg(null);
                try {
                  const token = localStorage.getItem('token');
                  if (!token) throw new Error('Not authenticated');
                  const costNum = Number(customCost);
                  await addActivity(selectedStopId, {
                    name: (customName || selectedPlace.name || 'New activity').slice(0, 120),
                    description: (customDesc || '').slice(0, 600),
                    type: (customType || 'poi').slice(0, 30),
                    cost: isNaN(costNum) ? 0 : costNum,
                    image_url: customImage || selectedPlace.image || undefined,
                  }, token);
                  setSaveMsg('Added to trip!');
                  // Clean up shortly and close
                  setTimeout(() => { setOpen(false); setSelectedPlace(null); setSelectedStopId(''); setSelectedTripId(''); setSaveMsg(null); }, 900);
                } catch (e: any) {
                  setSaveMsg(e?.message || 'Failed to add');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? 'Saving...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SmartSuggestions;
