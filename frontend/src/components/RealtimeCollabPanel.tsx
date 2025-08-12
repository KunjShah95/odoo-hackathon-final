import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../utils/realtime';
import { Socket } from 'socket.io-client';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User } from '../types';
import { Send, Wifi, Activity } from 'lucide-react';
import { getCollabMessages, postCollabMessage } from '../utils/api';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  ts: number;
}

interface PresenceUser {
  id: string;
  name: string;
  color: string;
  lastPing: number;
}

interface RealtimeCollabPanelProps {
  user: User;
  tripId: string;
}

// Simple color palette for presence
const COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];

export default function RealtimeCollabPanel({ user, tripId }: RealtimeCollabPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load persisted messages once
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    if (!token) return;
    getCollabMessages(tripId, token).then((rows:any[])=>{
      const mapped = rows.map(r=>({ id: String(r.id), userId: String(r.user_id), userName: r.user_name || 'User', text: r.text, ts: new Date(r.created_at).getTime() }));
      setMessages(mapped);
    }).catch(()=>{});
  }, [tripId]);

  // Initialize socket.io collaboration
  useEffect(() => {
    const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
    const socket = getSocket(apiUrl);
    socketRef.current = socket;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (socket) {
      socket.emit('join_trip', tripId);
    }
    // send presence ping
    const sendPresence = () => socket.emit('collab_message', { tripId, system: true, presence: true, user: { id: user.id, name: user.name, color } });
    sendPresence();
    const ping = setInterval(sendPresence, 5000);
    socket.on('collab_message', (payload: any) => {
      if (payload?.presence && payload.user) {
        const pu = payload.user;
        setPresence(prev => {
          const existing = prev.find(p => p.id === pu.id);
          if (existing) return prev.map(p => p.id === pu.id ? { ...p, lastPing: Date.now() } : p);
          return [...prev, { id: pu.id, name: pu.name, color: pu.color, lastPing: Date.now() }];
        });
      } else if (payload?.text) {
        setMessages(prev => [...prev, { id: String(payload.ts), userId: payload.user.id, userName: payload.user.name, text: payload.text, ts: payload.ts }]);
      }
    });
    return () => { clearInterval(ping); };
  }, [tripId, user.id, user.name]);

  // Cleanup stale presence (10s timeout)
  useEffect(() => {
    const interval = setInterval(() => {
      setPresence(prev => prev.filter(p => Date.now() - p.lastPing < 10000));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
  if (!text.trim() || !socketRef.current) return;
  const payload = { tripId, user: { id: user.id, name: user.name }, text: text.trim() };
  socketRef.current.emit('collab_message', payload);
  // persist
  const token = localStorage.getItem('token') || '';
  if (token) postCollabMessage(tripId, text.trim(), token).catch(()=>{});
    setText('');
  };

  return (
    <Card className="shadow border-0 mb-8">
      <CardHeader className="bg-blue-50 rounded-t-xl">
        <CardTitle className="flex items-center justify-between text-blue-900">
          <span>Live Collaboration</span>
          <Badge variant="secondary" className="bg-white/80 text-xs flex items-center"><Wifi className="w-3 h-3 mr-1" />{presence.length} online</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Presence Avatars */}
        <div className="flex -space-x-2">
          {presence.map(p => (
            <div key={p.id} className="relative">
              <Avatar className="w-8 h-8 border-2 border-white" style={{ backgroundColor: p.color }}>
                <AvatarFallback className="text-white text-xs font-semibold">{p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="h-48 bg-gray-50 rounded-md p-3 overflow-y-auto text-sm space-y-2">
          {messages.length === 0 && <p className="text-gray-400 text-xs">Start collaborating by sending a message...</p>}
          {messages.map(m => (
            <div key={m.id} className={`p-2 rounded-md ${m.userId === user.id ? 'bg-blue-600 text-white ml-auto' : 'bg-white border'} max-w-[70%]`}>              
              <div className="text-[10px] opacity-70 mb-0.5 flex items-center space-x-1">
                <span>{m.userName}</span>
                <span>•</span>
                <span>{new Date(m.ts).toLocaleTimeString()}</span>
              </div>
              <div className="leading-snug">{m.text}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          />
          <Button onClick={sendMessage} disabled={!text.trim()}>
            <Send className="w-4 h-4 mr-1" /> Send
          </Button>
        </div>
  <p className="text-[10px] text-gray-400 flex items-center space-x-1"><Activity className="w-3 h-3 mr-1" /> Real-time powered by WebSockets.</p>
      </CardContent>
    </Card>
  );
}
