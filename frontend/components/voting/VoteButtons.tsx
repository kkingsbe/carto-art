'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface VoteButtonsProps {
  mapId: string;
  initialVote: number | null;
  initialScore: number;
}

export function VoteButtons({ mapId, initialVote, initialScore }: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<number | null>(initialVote);
  const [score, setScore] = useState(initialScore);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (value: number) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // If clicking the same vote, remove the vote
      if (userVote === value) {
        setUserVote(null);
        setScore(score - value);
        // TODO: Call API to remove vote
      } else {
        // If changing vote, adjust score by the difference
        const voteChange = userVote ? value - userVote : value;
        setUserVote(value);
        setScore(score + voteChange);
        // TODO: Call API to submit vote
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      // Revert on error
      setUserVote(userVote);
      setScore(score);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userVote === 1 ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className="gap-1"
      >
        <ArrowUp className="w-4 h-4" />
      </Button>

      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[2rem] text-center">
        {score}
      </span>

      <Button
        variant={userVote === -1 ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className="gap-1"
      >
        <ArrowDown className="w-4 h-4" />
      </Button>
    </div>
  );
}
