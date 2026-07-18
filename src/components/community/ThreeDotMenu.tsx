'use client';

import { MoreHorizontal, Copy, Flag, ExternalLink, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ThreeDotMenuProps {
  postId: string;
  isOwner?: boolean;
  onDelete?: () => void;
  className?: string;
}

export function ThreeDotMenu({ postId, isOwner, onDelete, className }: ThreeDotMenuProps) {
  const { toast } = useToast();

  return (
    <TooltipProvider delayDuration={200}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-7 w-7 p-0 text-muted-foreground hover:text-foreground', className)}
                aria-label="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">More</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/community/posts/${postId}`);
              toast({ title: 'Link copied' });
            }}
          >
            <Copy className="w-3.5 h-3.5 mr-2" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({ title: 'Report submitted' })}>
            <Flag className="w-3.5 h-3.5 mr-2" />
            Report
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isOwner && (
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
