'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/control-components';
import { addComment } from '@/lib/actions/comments';
import type { Comment } from '@/lib/actions/comments';

interface CommentFormProps {
  mapId: string;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentForm({ mapId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    const commentText = content.trim();
    setContent('');

    startTransition(async () => {
      try {
        await addComment(mapId, commentText);
        // Reload page to get updated comments with profile info
        window.location.reload();
      } catch (error) {
        console.error('Failed to add comment:', error);
        alert('Failed to add comment. Please try again.');
        setContent(commentText); // Restore content on error
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || isPending}
          size="sm"
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}

