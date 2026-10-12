import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, X, Film } from 'lucide-react';
import { catalogApi } from '../../api/index.js';
import { AnimeCard } from '../../components/user/AnimeCarousel.jsx';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) setSearchParams({ q: query }); else setSearchParams({});
    }, 300);
    return () => clearTimeout(handler);
  }, [query, setSearchParams]);

  const { data: genresData } = useQuery({
    queryKey: ['genresList'],
    queryFn: () => catalogApi.genres(),
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, selectedGenre, selectedType, selectedStatus, selectedYear],
    queryFn: () => catalogApi.search(debouncedQuery, {
      genre: selectedGenre || undefined,
      type: selectedType || undefined,
      status: selectedStatus || undefined,
      year: selectedYear || undefined,
    }),
    enabled: !!debouncedQuery || !!selectedGenre || !!selectedType,
  });

  const clearFilters = () => {
    setSelectedGenre(''); setSelectedType(''); setSelectedStatus(''); setSelectedYear(''); setQuery('');
  };

  const resultsList = searchResults?.results || (Array.isArray(searchResults) ? searchResults : []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-[96px] px-6 lg:px-10 pb-24">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className="space-y-3">
          <h1 className="text-h1 font-display font-bold text-text-primary">Search</h1>
          <p className="text-text-muted text-body">Find anime across our entire library.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, characters, genres..."
            className="w-full pl-12 pr-10 py-3.5 bg-surface-1 border border-border rounded-btn text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 text-body transition-colors"
            autoFocus />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-meta font-medium text-text-muted pr-2">
            <Filter className="w-4 h-4 text-brand" /> Filters:
          </div>
          <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-3 py-2 bg-surface-1 border border-border rounded-btn text-meta text-text-secondary focus:outline-none focus:border-brand">
            <option value="">All Genres</option>
            {genresData?.map((g) => {
              const name = typeof g === 'string' ? g : g.name;
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-surface-1 border border-border rounded-btn text-meta text-text-secondary focus:outline-none focus:border-brand">
            <option value="">All Types</option>
            <option value="series">Series</option>
            <option value="movie">Movie</option>
            <option value="clip">Clip / AMV</option>
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-surface-1 border border-border rounded-btn text-meta text-text-secondary focus:outline-none focus:border-brand">
            <option value="">All Statuses</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <input type="number" placeholder="Year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            className="w-24 px-3 py-2 bg-surface-1 border border-border rounded-btn text-meta text-text-secondary placeholder:text-text-disabled focus:outline-none focus:border-brand" />
          {(selectedGenre || selectedType || selectedStatus || selectedYear) && (
            <button onClick={clearFilters} className="text-meta text-brand hover:text-brand-hover font-semibold px-2 py-1 transition-colors">Reset</button>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-surface-1 rounded-card-sm animate-pulse" />
            ))}
          </div>
        ) : resultsList.length > 0 ? (
          <div className="space-y-4">
            <p className="text-meta text-text-muted">
              Found <span className="text-brand font-semibold">{resultsList.length}</span> results
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {resultsList.map((anime) => (
                <div key={anime.id} className="flex justify-center">
                  <AnimeCard anime={anime} />
                </div>
              ))}
            </div>
          </div>
        ) : debouncedQuery || selectedGenre ? (
          <div className="p-16 text-center space-y-4 bg-surface-1/40 rounded-card border border-border-subtle max-w-lg mx-auto">
            <Film className="w-10 h-10 text-text-disabled mx-auto" />
            <h3 className="text-h3 font-semibold text-text-primary">No results found</h3>
            <p className="text-text-muted text-meta">Try different keywords or adjust your filters.</p>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <Search className="w-10 h-10 text-text-disabled mx-auto" />
            <h3 className="text-body-lg font-semibold text-text-muted">Start typing to search</h3>
            <p className="text-caption text-text-disabled">Find thousands of anime series, movies, and episodes.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
