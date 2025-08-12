import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle, Plus, Trash2, Sparkles } from 'lucide-react';
import { aiSuggest } from '../utils/api';

const DEFAULT_ITEMS = [
  'Passport',
  'Travel tickets',
  'Clothes',
  'Toiletries',
  'Phone charger',
  'Travel insurance',
  'Medications',
  'Camera',
  'Sunscreen',
  'Umbrella',
];

const PackingListGenerator: React.FC = () => {
  const [items, setItems] = useState(
    DEFAULT_ITEMS.map(item => ({ text: item, checked: false }))
  );
  const [newItem, setNewItem] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    if (!newItem) return;
    setItems([...items, { text: newItem, checked: false }]);
    setNewItem('');
  };

  const toggleItem = (idx: number) => {
    setItems(items.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const generateAIItems = async () => {
    try {
      setAiLoading(true); setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Login required for AI');
      const res = await aiSuggest('Suggest 10 concise packing list items for a multi-city trip. Return comma separated list only.', token);
      const text = res?.result || '';
      const parts = text
        .split(/[\,\n]/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 2 && !items.find(i => i.text.toLowerCase() === p.toLowerCase()));
      if (parts.length) setItems(prev => [...prev, ...parts.slice(0, 10).map((p: string) => ({ text: p, checked: false }))]);
    } catch (e: any) {
      setError(e.message || 'AI failed');
    } finally { setAiLoading(false); }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" /> Packing List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Add item..." value={newItem} onChange={e => setNewItem(e.target.value)} />
          <Button onClick={addItem} disabled={!newItem}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
          <Button type="button" variant="outline" onClick={generateAIItems} disabled={aiLoading}>
            <Sparkles className="w-4 h-4 mr-1" /> {aiLoading ? 'Thinking...' : 'AI Suggest'}
          </Button>
        </div>
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input type="checkbox" checked={item.checked} onChange={() => toggleItem(idx)} />
              <span className={item.checked ? 'line-through text-gray-400' : ''}>{item.text}</span>
              <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PackingListGenerator;
