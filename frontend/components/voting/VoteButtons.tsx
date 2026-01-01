'use client';

import { useState, useTransition } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/control-components';
import { voteOnMap, removeVote } from '@/lib/actions/votes';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  mapId: string;
  initialVote: number | null;
  initialScore: number;
}

export function VoteButtons({ mapId, initialVote, initialScore }: VoteButtonsProps) {
  const [vote, setVote] = useState<number | null>(initialVote);
  const [score, setScore] = useState(initialScore);
  const [isPending, startTransition] = useTransition();

  const handleVote = async (value: 1 | -1) => {
    const newVote = vote === value ? null : value;
    const scoreDelta = newVote === null
      ? -vote! // Removing vote
      : vote === null
        ? newVote // Adding new vote
        : newVote - vote; // Changing vote

    // Optimistic update
    setVote(newVote);
    setScore(score + scoreDelta);

    startTransition(async () => {
      try {
        if (newVote === null) {
          await removeVote(mapId);
        } else {
          await voteOnMap(mapId, value);
        }
      } catch (error) {
        // Revert on error
        setVote(vote);
        setScore(score);
        console.error('Failed to vote:', error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={isPending}
        className={cn(
          "p-1",
          vote === 1 && "text-blue-600 dark:text-blue-400"
        )}
      >
        <ChevronUp className="w-5 h-5" />
      </Button>
      
      <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
        {score}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={isPending}
        className={cn(
          "p-1",
          vote === -1 && "text-blue-600 dark:text-blue-400"
        )}
      >
        <ChevronDown className="w-5 h-5" />
      </Button>
    </div>
  );
}

