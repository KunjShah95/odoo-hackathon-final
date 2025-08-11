import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
// Leaflet CSS should be imported once globally (can move to globals.css if desired)
import 'leaflet/dist/leaflet.css';
import { Trip } from '../types';
import { geocodeCity } from '../utils/opentripmap';

interface MapViewProps {
  trip?: Trip;
}

const MapView: React.FC<MapViewProps> = ({ trip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapId] = useState(() => `trip-map-${Math.random().toString(36).slice(2)}`);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    let map: any; // will be assigned after dynamic import
    let Lmod: typeof import('leaflet') | null = null;
    (async () => {
      try {
        const L = await import('leaflet');
        Lmod = L;
        map = L.map(mapId, { center: [20,0], zoom: 2 });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        initPlot(L);
      } catch (e: any) {
        setError(e.message || 'Failed to initialize map');
      }
    })();

    let destroyed = false;
    const cityCache: Record<string, { lat: number; lon: number }> = {};

    function haversine(a: [number, number], b: [number, number]) {
      const R = 6371; // km
      const toRad = (x: number) => x * Math.PI / 180;
      const dLat = toRad(b[0]-a[0]);
      const dLon = toRad(b[1]-a[1]);
      const lat1 = toRad(a[0]);
      const lat2 = toRad(b[0]);
      const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
      return 2*R*Math.asin(Math.sqrt(h));
    }

    const FAIL_TTL_MS = 60 * 60 * 1000; // 1 hour

    async function initPlot(L: typeof import('leaflet')) {
      await plot(L);
    }

    async function plot(L: typeof import('leaflet')) {
      if (!trip?.cities?.length) return;
      setLoading(true); setError(null);
      try {
        const coords: [number, number][] = [];
        for (const city of trip.cities) {
          if (cityCache[city]) {
            coords.push([cityCache[city].lat, cityCache[city].lon]);
            continue;
          }
          const cached = sessionStorage.getItem(`geo:${city}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.failUntil && Date.now() < parsed.failUntil) {
              // recent failure cached, skip requesting again
              continue;
            }
            if (parsed.lat && parsed.lon) {
              cityCache[city] = parsed; coords.push([parsed.lat, parsed.lon]); continue;
            }
          }
          const g = await geocodeCity(city);
          if (g?.lat && g?.lon) {
            cityCache[city] = { lat: g.lat, lon: g.lon };
            sessionStorage.setItem(`geo:${city}`, JSON.stringify(cityCache[city]));
            coords.push([g.lat, g.lon]);
          } else {
            // cache failure with TTL
            sessionStorage.setItem(`geo:${city}`, JSON.stringify({ failUntil: Date.now() + FAIL_TTL_MS }));
          }
        }
        if (coords.length) {
          coords.forEach(([lat, lon], idx) => {
            L.marker([lat, lon]).addTo(map).bindPopup(trip.cities[idx]);
          });
          if (coords.length > 1) {
            const poly = L.polyline(coords as any, { color: 'purple' }).addTo(map);
            map.fitBounds(poly.getBounds().pad(0.3));
            // distance sum
            let total = 0;
            for (let i=1;i<coords.length;i++) total += haversine(coords[i-1], coords[i]);
            setTotalDistanceKm(parseFloat(total.toFixed(1)));
          } else if (coords.length === 1) {
            map.setView(coords[0], 8);
            setTotalDistanceKm(0);
          }
        } else {
          setTotalDistanceKm(null);
        }
      } catch (e: any) {
        if (!destroyed) setError(e.message || 'Failed to load map data');
      } finally {
        if (!destroyed) setLoading(false);
      }
    }

    return () => { destroyed = true; if (map) map.remove(); };
  }, [trip, mapId]);

  return (
  <Card className="mb-6">
      <CardHeader>
    <CardTitle>Trip Route Map</CardTitle>
      </CardHeader>
      <CardContent>
    {loading && <div className="text-xs text-gray-500 mb-1">Geocoding cities...</div>}
    {error && <div className="text-xs text-red-600 mb-1">{error}</div>}
    {totalDistanceKm != null && !loading && !error && (
      <div className="text-xs text-gray-600 mb-1">Total route distance: <span className="font-medium">{totalDistanceKm} km</span></div>
    )}
    <div id={mapId} className="h-72 w-full rounded-md overflow-hidden" />
      </CardContent>
    </Card>
  );
};

export default MapView;
