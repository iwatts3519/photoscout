'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleFavoriteAction } from '@/app/actions/favorites';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  locationId: string;
  initialFavorited: boolean;
  initialCount: number;
  showCount?: boolean;
  size?: 'sm' | 'default';
}

export function FavoriteButton({
  locationId,
  initialFavorited,
  initialCount,
  showCount = true,
  size = 'default',
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  const handleToggle = () => {
    if (!user) {
      toast.error('Sign in required', {
        description: 'You must be signed in to favorite locations.',
      });
      return;
    }

    // Optimistic update
    const previousFavorited = isFavorited;
    const previousCount = count;
    setIsFavorited(!isFavorited);
    setCount(isFavorited ? count - 1 : count + 1);

    startTransition(async () => {
      const result = await toggleFavoriteAction(locationId);

      if (result.error) {
        // Revert on error
        setIsFavorited(previousFavorited);
        setCount(previousCount);
        toast.error('Failed to update favorite', {
          description: result.error,
        });
      } else if (result.data) {
        // Update with actual server values
        setIsFavorited(result.data.is_favorited);
        setCount(result.data.new_count);
      }
    });
  };

  return (
    <Button
      variant={isFavorited ? 'default' : 'outline'}
      size={size}
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'gap-1.5',
        isFavorited && 'bg-red-500 hover:bg-red-600 text-white border-red-500'
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          isFavorited && 'fill-current'
        )}
      />
      {showCount && <span>{count}</span>}
    </Button>
  );
}
