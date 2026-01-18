'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/control-components';
import type { Comment } from '@/lib/actions/comments';

interface CommentFormProps {
  mapId: string;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentForm({ mapId, onCommentAdded }: CommentFormProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedText = text.trim();
    if (!trimmedText) {
      setError('Please enter a comment');
      return;
    }

    if (trimmedText.length > 1000) {
      setError('Comment must be less than 1000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would call an API to create the comment
      // For now, we'll create a mock comment
      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: trimmedText,
        author: 'Anonymous', // In a real app, this would be the logged-in user
        createdAt: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      onCommentAdded(newComment);
      setText('');
    } catch (err) {
      setError('Failed to post comment. Please try again.');
      console.error('Error submitting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = text.length;
  const isNearLimit = characterCount > 800;
  const isAtLimit = characterCount >= 1000;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts about this map..."
          rows={3}
          maxLength={1000}
          disabled={isSubmitting}
          className={`
            w-full px-3 py-2 text-sm rounded-md border
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            transition-shadow
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'}
          `}
        />
        <div className="flex items-center justify-between mt-1">
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="ml-auto">
            <p className={`
              text-xs
              ${isAtLimit ? 'text-red-600 dark:text-red-400' : isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}
            `}>
              {characterCount}/1000
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          size="sm"
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⏳</span>
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
