import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin, TrendingUp, Plus } from 'lucide-react';

// Legacy direct utils kept as fallback
import { fetchPopularPlaces, fetchPlaceDetails } from '../utils/opentripmap';
import { generateCreativeSuggestion } from '../utils/huggingface';
import { aiSuggest, getNearbyPlaces } from '../utils/api';

const DEFAULT_COORDS = { lat: 51.5074, lon: -0.1278 }; // London

const SmartSuggestions: React.FC = () => {
  const [places, setPlaces] = useState<any[]>([]);
  const [creative, setCreative] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let details: any[] = [];
        try {
          if (token) {
            const nearby = await getNearbyPlaces({ ...DEFAULT_COORDS, radius: 15000, limit: 3 }, token);
            const items = nearby.items || [];
            details = await Promise.all(items.map((p: any) => fetchPlaceDetails(p.xid).catch(()=>p)));
          }
        } catch (e) {
          // Fallback to direct client call if backend proxy or key fails
          const rawPlaces = await fetchPopularPlaces({ ...DEFAULT_COORDS, radius: 20000, limit: 3 });
          details = await Promise.all(rawPlaces.map((p: any) => fetchPlaceDetails(p.xid)));
        }
        setPlaces(details);
        try {
          if (token) {
            const ai = await aiSuggest('Suggest a unique, sustainable, budget-friendly travel experience:', token);
            if (ai?.result) setCreative(ai.result);
            else throw new Error('Empty AI result');
          } else {
            throw new Error('Missing token');
          }
        } catch (e) {
          // Fallback local small model direct call (may fail silently if no key) then static message
            try {
              const creativeText = await generateCreativeSuggestion('Suggest a unique travel experience for a young explorer:');
              if (creativeText) setCreative(creativeText);
            } catch {
              setCreative('Explore hidden local food markets and pair them with a sunrise photo walk for an authentic cultural immersion.');
            }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Card className="shadow-md border-0 mb-8">
      <CardHeader>
        <CardTitle className="text-blue-900">Smart Suggestions for You</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-blue-600">Loading smart suggestions...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            {error}
            <div className="mt-2 text-xs text-gray-500">Using fallback suggestions.</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {places.map(place => (
                <div key={place.xid} className="rounded-xl overflow-hidden bg-white shadow group hover:shadow-lg transition-shadow">
                  {place.preview?.source ? (
                    <img src={place.preview.source} alt={place.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-400">No Image</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="font-semibold text-lg text-blue-900">{place.name}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{place.kinds?.split(',')[0] || 'Interesting place'}</p>
                    <Button size="sm" variant="outline" className="mr-2" asChild>
                      <a href={place.otm} target="_blank" rel="noopener noreferrer">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Explore
                      </a>
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Trip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {creative && (
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 text-center mb-2">
                <h3 className="font-semibold text-lg text-blue-900 mb-2">AI Creative Suggestion</h3>
                <p className="text-gray-700 italic">{creative}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartSuggestions;
