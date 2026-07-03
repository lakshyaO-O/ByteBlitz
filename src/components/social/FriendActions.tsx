'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2, MessageCircle, Swords, BookOpen, Flag } from 'lucide-react';

interface FriendActionsProps {
  friendStatus: 'none' | 'pending' | 'friends';
  sendingRequest: boolean;
  onAddFriend: () => void;
  onMessage: () => void;
  onInviteArena: () => void;
  onInviteStudyRoom: () => void;
  onReport?: () => void;
}

export function FriendActions({
  friendStatus, sendingRequest, onAddFriend, onMessage,
  onInviteArena, onInviteStudyRoom, onReport,
}: FriendActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {friendStatus === 'friends' ? (
        <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs cursor-default">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Friends
        </Button>
      ) : friendStatus === 'pending' ? (
        <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs cursor-default">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending
        </Button>
      ) : (
        <Button onClick={onAddFriend} disabled={sendingRequest} size="sm" className="gap-1.5 text-xs">
          {sendingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          Add Friend
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onMessage} className="gap-1.5 text-xs">
        <MessageCircle className="w-3.5 h-3.5" /> Message
      </Button>
      <Button variant="outline" size="sm" onClick={onInviteArena} className="gap-1.5 text-xs">
        <Swords className="w-3.5 h-3.5" /> Invite to Arena
      </Button>
      <Button variant="outline" size="sm" onClick={onInviteStudyRoom} className="gap-1.5 text-xs">
        <BookOpen className="w-3.5 h-3.5" /> Study Room
      </Button>
      {onReport && (
        <Button variant="ghost" size="sm" onClick={onReport} className="gap-1.5 text-xs text-muted-foreground ml-auto">
          <Flag className="w-3.5 h-3.5" /> Report
        </Button>
      )}
    </div>
  );
}
