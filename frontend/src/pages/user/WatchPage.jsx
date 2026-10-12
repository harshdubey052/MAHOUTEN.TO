import React, { useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, SkipForward, AlertCircle } from 'lucide-react';
import { catalogApi, streamingApi } from '../../api/index.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import VideoPlayer from '../../components/user/VideoPlayer.jsx';
import { getMediaUrl } from '../../utils/media.js';

export default function WatchPage() {
  const { animeSlug, episodeId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useProfile();
  const lastSaveTimeRef = useRef(0);

  const { data: anime, isLoading: isAnimeLoading } = useQuery({
    queryKey: ['animeDetail', animeSlug],
    queryFn: () => catalogApi.animeDetail(animeSlug),
  });

  const { data: episodesData, isLoading: isEpisodesLoading } = useQuery({
    queryKey: ['animeEpisodes', animeSlug],
    queryFn: () => catalogApi.episodes(animeSlug),
  });

  const allEpisodes = Array.isArray(episodesData)
    ? episodesData
    : (episodesData?.episodes || episodesData?.seasons?.flatMap(s => s.episodes || []) || []);
  const currentEpisodeIndex = allEpisodes.findIndex(e => String(e.id) === String(episodeId));
  const currentEpisode = allEpisodes[currentEpisodeIndex] || null;
  const nextEpisode = currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1
    ? allEpisodes[currentEpisodeIndex + 1] : null;

  const handleProgress = (currentTime, duration) => {
    const now = Date.now();
    if (now - lastSaveTimeRef.current >= 10000 && activeProfile?.id && currentEpisode?.id) {
      lastSaveTimeRef.current = now;
      streamingApi.saveProgress({
        profile_id: activeProfile.id,
        episode_id: currentEpisode.id,
        seconds: Math.floor(currentTime),
      }).catch(err => console.error('Failed to save progress:', err));
    }
  };

  const handleEnded = () => {
    if (nextEpisode) navigate(`/watch/${animeSlug}/${nextEpisode.id}`);
  };

  if (isAnimeLoading || isEpisodesLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-meta">Loading player...</p>
        </div>
      </div>
    );
  }

  if (!currentEpisode) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="w-14 h-14 text-red-500" />
        <h2 className="text-h2 font-bold text-text-primary">Episode Not Found</h2>
        <p className="text-text-muted text-meta">We couldn't locate this episode's stream.</p>
        <button onClick={() => navigate(`/anime/${animeSlug}`)}
          className="px-6 py-2.5 rounded-btn bg-brand hover:bg-brand-hover text-white font-semibold transition-colors">
          Return to Show
        </button>
      </div>
    );
  }

  const streamSource = getMediaUrl(currentEpisode.hls_url) || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        <button onClick={() => navigate(`/anime/${animeSlug}`)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary bg-black/40 hover:bg-black/60 px-4 py-2 rounded-btn border border-white/10 backdrop-blur-sm transition-all text-meta font-medium">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to {anime?.title}</span>
        </button>
        <div className="text-center">
          <h2 className="text-meta font-semibold text-text-primary line-clamp-1">{anime?.title}</h2>
          <p className="text-caption text-text-muted">Ep. {currentEpisode.number}: {currentEpisode.title}</p>
        </div>
        {nextEpisode ? (
          <Link to={`/watch/${animeSlug}/${nextEpisode.id}`}
            className="flex items-center gap-1.5 text-meta font-semibold text-brand hover:text-white bg-brand/20 hover:bg-brand px-3.5 py-2 rounded-btn border border-brand/30 transition-all backdrop-blur-sm">
            <span>Next</span> <SkipForward className="w-3.5 h-3.5" />
          </Link>
        ) : <div className="w-20" />}
      </div>

      <VideoPlayer
        src={streamSource}
        title={anime?.title}
        episodeTitle={`Ep. ${currentEpisode.number}: ${currentEpisode.title}`}
        introStart={currentEpisode.intro_start || 0}
        introEnd={currentEpisode.intro_end || 0}
        onProgress={handleProgress}
        onEnded={handleEnded}
        subtitles={currentEpisode.subtitles || []}
      />
    </div>
  );
}
