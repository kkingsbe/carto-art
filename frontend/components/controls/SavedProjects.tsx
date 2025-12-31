'use client';

import { useState } from 'react';
import { Save, Trash2, FolderOpen, Clock, Edit2, Check, X } from 'lucide-react';
import type { PosterConfig, SavedProject } from '@/types/poster';

interface SavedProjectsProps {
  projects: SavedProject[];
  currentConfig: PosterConfig;
  onSave: (name: string, config: PosterConfig) => void;
  onLoad: (config: PosterConfig) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function SavedProjects({
  projects,
  currentConfig,
  onSave,
  onLoad,
  onDelete,
  onRename
}: SavedProjectsProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onSave(newName.trim(), currentConfig);
      setNewName('');
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
    }
  };

  const startEditing = (project: SavedProject) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Save Current Work</h3>
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Library ({projects.length})</h3>
        
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No saved projects yet.</p>
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
                          className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none"
                        />
                        <button onClick={() => handleRename(project.id)} className="p-1 text-green-600 hover:text-green-700 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:text-red-700 transition-colors">
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
                      onClick={() => onDelete(project.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => onLoad(project.config)}
                  className="w-full mt-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                >
                  Load Project
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

