import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { User } from '../types';
import { Send, Wifi, Activity } from 'lucide-react';

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
  const channelRef = useRef<BroadcastChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize broadcast channel for local tab real-time simulation
  useEffect(() => {
    const channel = new BroadcastChannel(`trip-${tripId}-collab`);
    channelRef.current = channel;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const announce = () => channel.postMessage({ type: 'presence', user: { id: user.id, name: user.name, color, ts: Date.now() } });
    announce();
    const ping = setInterval(announce, 5000);

    channel.onmessage = (ev) => {
      const data = ev.data;
      if (data.type === 'presence') {
        setPresence(prev => {
          const existing = prev.find(p => p.id === data.user.id);
          if (existing) {
            return prev.map(p => p.id === data.user.id ? { ...p, lastPing: Date.now() } : p);
          }
          return [...prev, { id: data.user.id, name: data.user.name, color: data.user.color, lastPing: Date.now() }];
        });
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      }
    };

    return () => {
      clearInterval(ping);
      channel.close();
    };
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
    if (!text.trim() || !channelRef.current) return;
    const message: Message = {
      id: `${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: text.trim(),
      ts: Date.now()
    };
    channelRef.current.postMessage({ type: 'message', message });
    setMessages(prev => [...prev, message]);
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
        <p className="text-[10px] text-gray-400 flex items-center space-x-1"><Activity className="w-3 h-3 mr-1" /> Demo real-time is local-tab only. Upgrade to WebSocket backend for multi-user.</p>
      </CardContent>
    </Card>
  );
}
