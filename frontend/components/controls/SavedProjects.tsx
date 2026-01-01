'use client';

import { useState } from 'react';
import { Trash2, FolderOpen, Clock, Edit2, Check, X } from 'lucide-react';
import type { SavedProject } from '@/types/poster';

interface SavedProjectsProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
}

export function SavedProjects({
  projects,
  onLoad,
  onDelete,
  onRename
}: SavedProjectsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async (id: string) => {
    if (!editName.trim() || renamingId === id) return;

    setRenamingId(id);
    setError(null);
    try {
      await onRename(id, editName.trim());
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to rename project. Please try again.');
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?') || deletingId === id) return;

    setDeletingId(id);
    setError(null);
    try {
      await onDelete(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (project: SavedProject) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          Saved Projects
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {projects.length}
        </span>
      </div>
      
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium mb-1">No saved projects yet</p>
          <p className="text-xs opacity-75">Use the Save button in the header to save your work</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="group p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
            >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === project.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                          className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none disabled:opacity-50"
                          disabled={renamingId === project.id}
                        />
                        <button 
                          onClick={() => handleRename(project.id)} 
                          className="p-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                          disabled={renamingId === project.id}
                        >
                          {renamingId === project.id ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingId(null);
                            setError(null);
                          }} 
                          className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                          disabled={renamingId === project.id}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h4>
                    )}
                    <div className="flex items-center mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(project)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete"
                      disabled={deletingId === project.id}
                    >
                      {deletingId === project.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => onLoad(project)}
                  className="w-full mt-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                >
                  Load Project
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

