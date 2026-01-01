'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/control-components';
import { deleteComment } from '@/lib/actions/comments';
import type { Comment } from '@/lib/actions/comments';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

interface CommentListProps {
  comments: Comment[];
  onCommentDeleted: (commentId: string) => void;
}

export function CommentList({ comments, onCommentDeleted }: CommentListProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      onCommentDeleted(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.profile?.display_name || comment.profile?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
            
            {userId === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(comment.id)}
                disabled={deletingId === comment.id}
                className="ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

