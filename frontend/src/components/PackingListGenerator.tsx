import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle, Plus, Trash2 } from 'lucide-react';

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
        </div>
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
