'use client';

import { ArrowLeft, MoreVertical, Trash2, User, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  username: string;
  photoURL: string;
  onlineStatus: string;
  typingUsers: string[];
  onBack?: () => void;
  onSearch?: () => void;
  onDeleteChat?: () => void;
  onViewProfile?: () => void;
}

const statusColors: Record<string, string> = {
  online: 'bg-emerald-400',
  offline: 'bg-muted-foreground',
  'in-game': 'bg-secondary',
};

export function ChatHeader({
  username, photoURL, onlineStatus, typingUsers,
  onBack, onSearch, onDeleteChat, onViewProfile,
}: ChatHeaderProps) {
  const showTyping = typingUsers.length > 0 && onBack;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
      {onBack && (
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="relative shrink-0" onClick={onViewProfile}>
        <Avatar className="w-9 h-9 border border-muted cursor-pointer">
          <AvatarImage src={photoURL} />
          <AvatarFallback className="bg-muted text-xs">{(username || '?')[0]}</AvatarFallback>
        </Avatar>
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
          statusColors[onlineStatus] || 'bg-muted-foreground',
        )} />
      </div>

      <div className="flex-1 min-w-0" onClick={onViewProfile}>
        <p className="text-sm font-bold truncate cursor-pointer hover:underline">{username}</p>
        <p className={cn('text-[10px]', showTyping ? 'text-primary' : 'text-muted-foreground')}>
          {showTyping ? 'typing...' : onlineStatus === 'online' ? 'Online' : 'Offline'}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {onSearch && (
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onSearch}>
            <Search className="w-4 h-4" />
          </Button>
        )}
        <div className="relative group">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-2xl z-50 py-1 hidden group-hover:block">
            {onViewProfile && (
              <button onClick={onViewProfile} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors">
                <User className="w-3.5 h-3.5" /> View Profile
              </button>
            )}
            {onDeleteChat && (
              <button onClick={onDeleteChat} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
