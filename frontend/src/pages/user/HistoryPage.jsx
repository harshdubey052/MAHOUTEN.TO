import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, Play, Clock, Sparkles } from 'lucide-react';
import { libraryApi } from '../../api/index.js';

export default function HistoryPage() {
  const { data: historyList, isLoading } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: () => libraryApi.history(),
  });

  const items = Array.isArray(historyList) ? historyList : historyList?.results || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-[96px] px-6 lg:px-10 pb-24 text-text-primary"
    >
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand text-caption font-semibold uppercase tracking-wider">
              <History className="w-3.5 h-3.5" /> Activity Log
            </div>
            <h1 className="text-h1 font-display font-bold text-text-primary">
              Watch History
            </h1>
          </div>
          <span className="text-meta font-medium text-text-muted">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-surface-1 rounded-card animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((entry) => {
              const anime = entry.anime;
              const episode = entry.episode;
              const progressPct =
                entry.seconds && episode?.duration
                  ? Math.min(100, Math.round((entry.seconds / (episode.duration * 60)) * 100))
                  : null;

              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-card bg-surface-1 hover:bg-surface-2 border border-border-subtle transition-all duration-200 hover:border-border-strong"
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-36 aspect-video rounded-card-sm overflow-hidden bg-background flex-shrink-0 border border-border-subtle">
                      <img
                        src={
                          episode?.thumbnail ||
                          anime?.poster ||
                          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300'
                        }
                        alt={anime?.title}
                        className="w-full h-full object-cover"
                      />
                      {progressPct !== null && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-3">
                          <div
                            className="h-full bg-brand"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <Link
                        to={`/anime/${anime?.slug}`}
                        className="font-semibold text-text-primary hover:text-brand transition-colors line-clamp-1 text-[15px]"
                      >
                        {anime?.title}
                      </Link>
                      <p className="text-caption text-text-muted">
                        {episode ? `Episode ${episode.number}: ${episode.title}` : 'Show Viewed'}
                      </p>
                      {entry.updated_at && (
                        <p className="text-[11px] text-text-disabled flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.updated_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resume Action */}
                  {episode && (
                    <Link
                      to={`/watch/${anime?.slug}/${episode?.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-btn bg-brand-soft hover:bg-brand border border-brand/20 hover:border-brand text-brand hover:text-white text-caption font-semibold transition-all shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Resume
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center space-y-4 bg-surface-1/40 rounded-card border border-border-subtle max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-text-disabled mx-auto" />
            <h2 className="text-h3 font-semibold text-text-primary">No watch history yet</h2>
            <p className="text-meta text-text-muted">
              Shows and episodes you watch will appear here so you can pick up right where you left off.
            </p>
            <Link
              to="/home"
              className="inline-block px-6 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white font-semibold transition-colors text-meta"
            >
              Start Watching
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
