import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroBillboard({ anime }) {
  if (!anime) return null;

  const genres = anime.genres?.map(g => typeof g === 'string' ? g : g.name) || [];
  const firstEpId = anime.first_episode_id || anime.id;

  return (
    <section className="relative w-full" style={{ height: 'clamp(480px, 65vh, 720px)' }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={anime.banner && !anime.banner.includes('1579783900882') ? anime.banner : '/wallpaper.png'}
          alt={anime.title}
          className="w-full h-full object-cover object-[50%_25%]"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-hero-left" />
        <div className="absolute inset-0 bg-hero-bottom" />
        <div className="absolute inset-0 bg-hero-top" />
        {/* Subtle atmospheric indigo */}
        <div className="absolute inset-0 bg-atmo-indigo" />
      </div>

      {/* Content */}
      <div className="absolute bottom-16 left-6 lg:left-10 z-10 max-w-2xl space-y-4">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="inline-block text-meta font-semibold uppercase tracking-[0.12em] text-brand">
            {anime.featured ? 'Featured' : 'Trending'}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display text-h1 md:text-display tracking-tight text-text-primary leading-[0.95]"
        >
          {anime.title}
        </motion.h1>

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-meta text-text-secondary flex-wrap"
        >
          {anime.type && <span className="uppercase">{anime.type === 'series' ? 'TV' : anime.type}</span>}
          {anime.year && <><span className="text-text-muted">•</span><span>{anime.year}</span></>}
          {anime.episode_count && <><span className="text-text-muted">•</span><span>{anime.episode_count} EP</span></>}
          {anime.age_rating && <><span className="text-text-muted">•</span><span className="border border-border-strong px-1.5 py-0.5 rounded text-[11px]">{anime.age_rating}</span></>}
        </motion.div>

        {/* Genre Tags */}
        {genres.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {genres.slice(0, 4).map((g) => (
              <span key={g} className="text-caption font-medium text-text-secondary bg-surface-1/60 border border-border-subtle px-2.5 py-1 rounded-chip">
                {g}
              </span>
            ))}
          </motion.div>
        )}

        {/* Synopsis */}
        {anime.synopsis && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-body text-text-secondary line-clamp-2 max-w-xl leading-relaxed"
          >
            {anime.synopsis}
          </motion.p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 pt-2"
        >
          <Link
            to={`/watch/${anime.slug}/${firstEpId}`}
            className="flex items-center gap-2.5 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-semibold text-[14px] rounded-btn transition-colors"
          >
            <Play className="w-4 h-4 fill-current" /> Watch Now
          </Link>
          <Link
            to={`/anime/${anime.slug}`}
            className="flex items-center gap-2.5 px-5 py-3 bg-surface-2/80 hover:bg-surface-3 border border-border text-text-primary font-medium text-[14px] rounded-btn transition-colors backdrop-blur-sm"
          >
            <Info className="w-4 h-4" /> More Info
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
