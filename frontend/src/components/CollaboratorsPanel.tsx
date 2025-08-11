import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UserPlus, Users } from 'lucide-react';

interface CollaboratorsPanelProps {
  tripId?: string;
}

const CollaboratorsPanel: React.FC<CollaboratorsPanelProps> = ({ tripId }) => {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!tripId) return;
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true); setError(null);
      try {
        const data = await import('../utils/api').then(m => m.getCollaborators(tripId, token));
        setCollaborators(data.map((c: any) => ({
          id: c.user.id,
          name: `${c.user.first_name} ${c.user.last_name}`.trim(),
          email: c.user.email,
          role: c.role
        })));
      } catch (e: any) {
        setError(e.message || 'Failed to load collaborators');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  const handleInvite = async () => {
    if (!inviteEmail || !tripId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await import('../utils/api').then(m => m.inviteCollaborator(tripId, inviteEmail, 'editor', token));
      setInviteStatus(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      // refresh
      const refreshed = await import('../utils/api').then(m => m.getCollaborators(tripId, token));
      setCollaborators(refreshed.map((c: any) => ({
        id: c.user.id,
        name: `${c.user.first_name} ${c.user.last_name}`.trim(),
        email: c.user.email,
        role: c.role
      })));
      setTimeout(() => setInviteStatus(null), 2000);
    } catch (e: any) {
      setInviteStatus(null);
      setError(e.message || 'Invite failed');
    }
  };

  const handleRemove = async (userId: number) => {
    if (!tripId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!window.confirm('Remove collaborator?')) return;
    try {
      await import('../utils/api').then(m => m.removeCollaborator(tripId, String(userId), token));
      setCollaborators(prev => prev.filter(c => c.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> Collaborators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Invite by email..."
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleInvite} disabled={!inviteEmail}>
            <UserPlus className="w-4 h-4 mr-1" /> Invite
          </Button>
        </div>
        {inviteStatus && <div className="text-green-600 mb-2 text-sm">{inviteStatus}</div>}
        {loading && <div className="text-xs text-gray-500 mb-2">Loading collaborators...</div>}
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        <ul className="space-y-2">
          {collaborators.map(c => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-gray-700 bg-gray-50 px-2 py-1 rounded">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-medium text-sm">{c.name}</span>{' '}
                  <span className="text-[10px] text-gray-500">{c.email}</span>
                  <span className="ml-1 text-[10px] text-blue-600">({c.role})</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleRemove(c.id)}>Remove</Button>
            </li>
          ))}
          {collaborators.length === 0 && !loading && !error && (
            <li className="text-xs text-gray-500">No collaborators yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CollaboratorsPanel;
