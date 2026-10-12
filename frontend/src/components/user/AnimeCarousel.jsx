import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Check, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../../api';
import { useProfile } from '../../context/ProfileContext';
import { getMediaUrl } from '../../utils/media';

export function AnimeCard({ anime, size = 'normal', variant = 'poster' }) {
  const [hovered, setHovered] = useState(false);
  const [inList, setInList] = useState(false);
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const toggleList = useMutation({
    mutationFn: async () => {
      if (!activeProfile) return;
      if (inList) {
        await libraryApi.removeFromList(activeProfile.id, anime.id);
        setInList(false);
      } else {
        await libraryApi.addToList({ profile_id: activeProfile.id, anime_id: anime.id });
        setInList(true);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myList'] }),
  });

  const cardWidth = size === 'large' ? '240px' : size === 'small' ? '160px' : '185px';

  if (variant === 'landscape') {
    return (
      <motion.div
        className="relative shrink-0 cursor-pointer group"
        style={{ width: '320px' }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        onClick={() => navigate(`/anime/${anime.slug || anime.id}`)}
      >
        <div className="relative rounded-card-lg overflow-hidden aspect-video bg-surface-1 border border-border-subtle">
          <img
            src={getMediaUrl(anime.banner || anime.poster, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=340&fit=crop')}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-card-hover opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-text-primary font-semibold text-[13px] line-clamp-1">{anime.title}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-0.5">
              {anime.year && <span>{anime.year}</span>}
              {anime.type && <><span>·</span><span className="uppercase">{anime.type}</span></>}
            </div>
          </div>
          {/* Progress bar for continue watching */}
          {anime.progress && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-surface-3">
              <div className="h-full bg-brand" style={{ width: `${anime.progress}%` }} />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative shrink-0 cursor-pointer group"
      style={{ width: cardWidth }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.04, y: -4, zIndex: 20 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/anime/${anime.slug || anime.id}`)}
    >
      {/* Poster Card */}
      <div className="relative rounded-card-sm overflow-hidden aspect-[2/3] bg-surface-1 border border-border-subtle transition-all duration-300 group-hover:border-border-strong group-hover:shadow-lg">
        <img
          src={getMediaUrl(anime.poster, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop')}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/60 to-transparent flex flex-col justify-end p-3 gap-2"
        >
          <p className="text-text-primary font-semibold text-[13px] leading-tight line-clamp-2">{anime.title}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            {anime.rating && (
              <>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{anime.rating}</span>
                <span className="text-text-muted">·</span>
              </>
            )}
            {anime.year && <span>{anime.year}</span>}
            {anime.type && <><span className="text-text-muted">·</span><span className="uppercase text-brand">{anime.type}</span></>}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/anime/${anime.slug || anime.id}`); }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-text-primary text-background text-[12px] font-bold py-1.5 rounded-chip hover:bg-white transition-colors"
            >
              <Play className="w-3 h-3 fill-current" /> Play
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleList.mutate(); }}
              className="p-1.5 bg-surface-3 border border-border rounded-chip hover:border-brand transition-colors"
            >
              {inList ? <Check className="w-3 h-3 text-brand" /> : <Plus className="w-3 h-3 text-text-primary" />}
            </button>
          </div>
        </motion.div>
        {/* Featured badge */}
        {anime.featured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand text-white text-[10px] font-bold rounded-chip uppercase tracking-wider">
            Featured
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AnimeCarousel({ title, items = [], size = 'normal', variant = 'poster' }) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = useCallback((dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' });
    setTimeout(updateScroll, 400);
  }, [updateScroll]);

  if (!items.length) return null;

  return (
    <section className="relative group/row">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 px-6 lg:px-10">
        <h2 className="text-h3 font-display font-semibold text-text-primary">{title}</h2>
        <div className="flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-full bg-surface-2 border border-border hover:bg-surface-3 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-1.5 rounded-full bg-surface-2 border border-border hover:bg-surface-3 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div className="relative">
        {/* Left fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        )}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar px-6 lg:px-10 scroll-smooth py-2"
          onScroll={updateScroll}
        >
          {items.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} size={size} variant={variant} />
          ))}
        </div>
        {/* Right fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        )}
      </div>
    </section>
  );
}

export default AnimeCarousel;
