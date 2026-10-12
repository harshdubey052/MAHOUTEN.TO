import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tags, Plus, Trash2 } from 'lucide-react';
import { adminApi, catalogApi } from '../../api/index.js';

export default function GenresPage() {
  const queryClient = useQueryClient();
  const [newGenreName, setNewGenreName] = useState('');

  const { data: genresData, isLoading } = useQuery({
    queryKey: ['adminGenres'],
    queryFn: () => catalogApi.genres(),
  });

  const createMutation = useMutation({
    mutationFn: (name) => adminApi.createGenre({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGenres'] });
      setNewGenreName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGenres'] });
    },
  });

  const genres = Array.isArray(genresData) ? genresData : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Genre Taxonomy</h1>
        <p className="text-zinc-400 text-sm">
          Add and manage genres for anime classification and discovery filters.
        </p>
      </div>

      {/* Add Genre Form */}
      <div className="flex gap-3 bg-surface p-4 rounded-2xl border border-surface-border">
        <input
          type="text"
          value={newGenreName}
          onChange={(e) => setNewGenreName(e.target.value)}
          placeholder="New genre name (e.g. Cyberpunk, Isekai, Romance)..."
          className="flex-1 px-4 py-2 bg-surface-card border border-surface-border rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={() => createMutation.mutate(newGenreName)}
          disabled={!newGenreName.trim() || createMutation.isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Genre
        </button>
      </div>

      {/* Genres List */}
      <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Existing Genres ({genres.length})
        </h2>

        {isLoading ? (
          <div className="flex gap-2 flex-wrap animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-24 bg-surface-card rounded-full" />
            ))}
          </div>
        ) : genres.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {genres.map((g, idx) => {
              const name = typeof g === 'string' ? g : g.name;
              const id = typeof g === 'object' ? g.id : name;
              return (
                <div
                  key={id || idx}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-border text-zinc-200 text-xs font-semibold hover:border-purple-500/40 transition-colors"
                >
                  <span>{name}</span>
                  {typeof g === 'object' && g.id && (
                    <button
                      onClick={() => deleteMutation.mutate(g.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm py-4">No genres created yet.</p>
        )}
      </div>
    </motion.div>
  );
}

