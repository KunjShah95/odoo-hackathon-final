import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Award, Globe, Star, Leaf } from 'lucide-react';

const BADGES = [
  { icon: <Globe className="w-6 h-6 text-blue-600" />, label: 'World Explorer', desc: 'Visited 5+ countries' },
  { icon: <Star className="w-6 h-6 text-yellow-500" />, label: 'Trip Master', desc: 'Planned 10+ trips' },
  { icon: <Leaf className="w-6 h-6 text-green-600" />, label: 'Eco Traveler', desc: 'Took a train or bus instead of a flight' },
  { icon: <Award className="w-6 h-6 text-purple-600" />, label: 'Group Leader', desc: 'Planned a trip with 3+ collaborators' },
];

const BadgesPanel: React.FC = () => (
  <Card className="mb-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Award className="w-5 h-5 text-purple-600" /> Achievements & Badges
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map((b, i) => (
          <div key={i} className="flex flex-col items-center bg-blue-50 rounded-xl p-4 shadow">
            {b.icon}
            <div className="font-semibold mt-2 text-blue-900">{b.label}</div>
            <div className="text-xs text-gray-600 text-center mt-1">{b.desc}</div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default BadgesPanel;
