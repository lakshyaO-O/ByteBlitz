'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, User, Loader2 } from 'lucide-react';
import { fetchDiscussion, postDiscussion } from '@/services/practice';

interface DiscussionPanelProps {
  problemId: string;
  userId: string | null;
  username: string;
}

export function DiscussionPanel({ problemId, userId, username }: DiscussionPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDiscussion(problemId).then(setMessages).catch(() => {}).finally(() => setLoading(false));
  }, [problemId]);

  const handlePost = async () => {
    if (!userId || !newMessage.trim()) return;
    setPosting(true);
    await postDiscussion(problemId, userId, username, newMessage.trim());
    setNewMessage('');
    await fetchDiscussion(problemId).then(setMessages);
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discussion</span>
        {!loading && <span className="text-[10px] text-muted-foreground">({messages.length})</span>}
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : messages.length > 0 ? (
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="p-2.5 rounded-lg bg-muted/20 border border-border text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3 h-3 text-primary" />
                  <span className="font-bold text-[10px]">{msg.username}</span>
                  <span className="text-[9px] text-muted-foreground ml-auto">
                    {msg.createdAt?.toMillis ? new Date(msg.createdAt.toMillis()).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-xs text-muted-foreground italic">No discussion yet. Be the first to comment!</p>
      )}

      {userId && (
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[36px] text-xs bg-muted/20 border-border resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); }
            }}
          />
          <Button size="sm" className="h-9 px-3 shrink-0" onClick={handlePost} disabled={!newMessage.trim() || posting}>
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
