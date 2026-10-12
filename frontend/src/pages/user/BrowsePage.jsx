import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { catalogApi } from '../../api/index.js';
import { AnimeCard } from '../../components/user/AnimeCarousel.jsx';

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';

  const [activeTab, setActiveTab] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [sortBy, setSortBy] = useState('-created_at');
  const [page, setPage] = useState(1);

  const { data: genresData } = useQuery({
    queryKey: ['genresList'],
    queryFn: () => catalogApi.genres(),
  });

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['browseCatalog', activeTab, selectedGenre, sortBy, page],
    queryFn: () =>
      catalogApi.animeList({
        type: activeTab === 'all' ? undefined : activeTab,
        genre: selectedGenre || undefined,
        ordering: sortBy,
        page,
      }),
  });

  const animeList = catalogData?.results || (Array.isArray(catalogData) ? catalogData : []);
  const totalCount = catalogData?.count || animeList.length;
  const pageSize = 24;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-[96px] px-6 lg:px-10 pb-24">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="space-y-2">
            <span className="text-meta font-semibold uppercase tracking-[0.1em] text-brand">Catalog</span>
            <h1 className="text-h1 font-display font-bold text-text-primary">Browse Anime</h1>
          </div>
          <select value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-surface-1 border border-border rounded-btn text-meta font-medium text-text-secondary focus:outline-none focus:border-brand">
            <option value="-created_at">Latest Added</option>
            <option value="-rating">Highest Rated</option>
            <option value="-year">Year (Newest)</option>
            <option value="year">Year (Oldest)</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'series', label: 'Series' },
            { id: 'movie', label: 'Movies' },
            { id: 'clip', label: 'Clips & AMVs' },
          ].map((tab) => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`px-4 py-2 rounded-btn text-meta font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'bg-surface-1 text-text-muted hover:text-text-secondary hover:bg-surface-2'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Genre Filter */}
        {genresData && genresData.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button onClick={() => { setSelectedGenre(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-chip text-caption font-semibold transition-colors whitespace-nowrap ${
                selectedGenre === '' ? 'bg-brand-soft text-brand border border-brand/30' : 'bg-surface-1 text-text-muted border border-transparent hover:bg-surface-2'
              }`}>All Genres</button>
            {genresData.map((g) => {
              const name = typeof g === 'string' ? g : g.name;
              return (
                <button key={name}
                  onClick={() => { setSelectedGenre(name === selectedGenre ? '' : name); setPage(1); }}
                  className={`px-3 py-1.5 rounded-chip text-caption font-semibold transition-colors whitespace-nowrap ${
                    selectedGenre === name ? 'bg-brand-soft text-brand border border-brand/30' : 'bg-surface-1 text-text-muted border border-transparent hover:bg-surface-2'
                  }`}>{name}</button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-surface-1 rounded-card-sm animate-pulse" />
            ))}
          </div>
        ) : animeList.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {animeList.map((anime) => (
                <div key={anime.id} className="flex justify-center">
                  <AnimeCard anime={anime} />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-1 hover:bg-surface-2 disabled:opacity-30 rounded-btn text-meta font-medium text-text-secondary transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-meta text-text-muted">
                  Page <span className="text-text-primary font-semibold">{page}</span> of <span className="text-text-primary font-semibold">{totalPages}</span>
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-1 hover:bg-surface-2 disabled:opacity-30 rounded-btn text-meta font-medium text-text-secondary transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center space-y-4 bg-surface-1/40 rounded-card border border-border-subtle max-w-lg mx-auto">
            <Film className="w-10 h-10 text-text-disabled mx-auto" />
            <h3 className="text-h3 font-semibold text-text-primary">No titles found</h3>
            <p className="text-text-muted text-meta">Try adjusting your filters or browse a different genre.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
