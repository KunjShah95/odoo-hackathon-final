import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { NotificationItem, Trip } from '../types';
import { cn } from './ui/utils';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  trips?: Trip[];
  loading?: boolean;
  error?: string | null;
}

const iconMap: Record<string, JSX.Element> = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
};

export default function NotificationCenter({ notifications, onMarkRead, onMarkAll, trips = [], loading, error }: NotificationCenterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Notifications</h4>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onMarkAll}>Mark all read</Button>
        )}
      </div>
      {loading && <p className="text-xs text-gray-500">Loading...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-8 text-xs text-gray-500">No notifications yet. ✨</div>
      )}
      <ScrollArea className="h-72 pr-2">
        <div className="space-y-2">
          {notifications.map(n => {
            const icon = iconMap[n.severity || 'info'];
            return (
              <div key={n.id} className={cn('p-3 rounded-md border text-xs space-y-1 bg-white', n.read ? 'opacity-60' : 'border-blue-200 shadow-sm')}>                
                <div className="flex items-start space-x-2">
                  {icon}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 text-xs">{n.title}</p>
                      {!n.read && <Badge className="bg-blue-600">New</Badge>}
                    </div>
                    <p className="text-gray-600 leading-snug text-[11px]">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                      {!n.read && (
                        <button onClick={() => onMarkRead(n.id)} className="text-[10px] text-blue-600 hover:underline">Mark read</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
