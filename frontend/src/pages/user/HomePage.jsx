import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi, streamingApi } from '../../api/index.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import HeroBillboard from '../../components/user/HeroBillboard.jsx';
import { AnimeCarousel } from '../../components/user/AnimeCarousel.jsx';

export default function HomePage() {
  const { activeProfile } = useProfile();

  // Fetch homepage rows
  const { data: rows, isLoading: rowsLoading } = useQuery({
    queryKey: ['homeRows'],
    queryFn: () => catalogApi.homeRows(),
  });

  // Fetch continue watching
  const { data: continueWatching } = useQuery({
    queryKey: ['continueWatching', activeProfile?.id],
    queryFn: () => streamingApi.continueWatching(activeProfile.id),
    enabled: !!activeProfile?.id,
  });

  if (rowsLoading) {
    return (
      <div className="w-full min-h-screen bg-background">
        {/* Hero skeleton */}
        <div className="w-full bg-surface-1 animate-pulse" style={{ height: 'clamp(480px, 65vh, 720px)' }} />
        {/* Row skeletons */}
        <div className="space-y-section-sm px-6 lg:px-10 pt-section-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-40 bg-surface-2 rounded animate-pulse" />
              <div className="flex gap-3">
                {[1,2,3,4,5,6].map(j => (
                  <div key={j} className="w-[185px] aspect-[2/3] bg-surface-1 rounded-card-sm animate-pulse shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Extract all anime and pick hero
  const allAnime = rows?.flatMap((r) => r.anime || []) || [];
  const heroItem = allAnime.find((a) => a.featured) || allAnime[0] || {
    title: 'Welcome to Mahouten.to',
    slug: '',
    synopsis: 'The premium anime streaming platform. Browse our catalog to find your next obsession.',
    genres: ['Action', 'Fantasy'],
    year: 2026,
    type: 'series',
    banner: '/wallpaper.png',
  };

  // Continue watching items
  const continueItems = Array.isArray(continueWatching) ? continueWatching : continueWatching?.results || [];

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Hero Billboard */}
      <HeroBillboard anime={heroItem} />

      {/* Content Rows */}
      <div className="relative z-10 -mt-8 space-y-section-sm pb-24">
        {/* Continue Watching */}
        {continueItems.length > 0 && (
          <AnimeCarousel
            title="Continue Watching"
            items={continueItems.map(item => ({
              ...(item.anime || item),
              progress: item.seconds && item.episode?.duration
                ? Math.min(100, Math.round((item.seconds / (item.episode.duration * 60)) * 100))
                : 30,
            }))}
            variant="landscape"
          />
        )}

        {/* Homepage Rows */}
        {rows?.map((row) => (
          <AnimeCarousel
            key={row.id || row.title}
            title={row.title}
            items={row.anime || []}
          />
        ))}
      </div>
    </div>
  );
}
