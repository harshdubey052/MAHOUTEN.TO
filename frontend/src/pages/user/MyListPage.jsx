import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bookmark, Trash2, Play } from 'lucide-react';
import { libraryApi } from '../../api/index.js';
import { AnimeCard } from '../../components/user/AnimeCarousel.jsx';

export default function MyListPage() {
  const queryClient = useQueryClient();

  const { data: myList, isLoading } = useQuery({
    queryKey: ['myList'],
    queryFn: () => libraryApi.myList(),
  });

  const removeMutation = useMutation({
    mutationFn: (animeId) => libraryApi.removeFromList(animeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myList'] }),
  });

  const items = Array.isArray(myList) ? myList : myList?.results || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-[96px] px-6 lg:px-10 pb-24">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border-subtle pb-6">
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-meta font-semibold uppercase tracking-[0.1em] text-brand">
              <Bookmark className="w-4 h-4 fill-current" /> Collection
            </span>
            <h1 className="text-h1 font-display font-bold text-text-primary">My List</h1>
          </div>
          <span className="text-meta text-text-muted">{items.length} {items.length === 1 ? 'title' : 'titles'}</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[2/3] bg-surface-1 rounded-card-sm animate-pulse" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {items.map((entry) => {
              const anime = entry.anime || entry;
              return (
                <div key={anime.id} className="relative group flex flex-col items-center">
                  <AnimeCard anime={anime} />
                  <button onClick={() => removeMutation.mutate(anime.id)} title="Remove"
                    className="mt-2 text-caption flex items-center gap-1 text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center space-y-5 bg-surface-1/40 rounded-card border border-border-subtle max-w-md mx-auto">
            <Bookmark className="w-10 h-10 text-text-disabled mx-auto" />
            <div className="space-y-2">
              <h2 className="text-h3 font-semibold text-text-primary">Your list is empty</h2>
              <p className="text-text-muted text-meta">Bookmark shows you want to watch later.</p>
            </div>
            <Link to="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-brand hover:bg-brand-hover text-white font-semibold text-[14px] transition-colors">
              <Play className="w-4 h-4 fill-current" /> Browse Catalog
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
