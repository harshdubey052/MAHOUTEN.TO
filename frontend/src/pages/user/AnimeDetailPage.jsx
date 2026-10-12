import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Plus, Check, Star, ArrowLeft, Clock, Film, MessageSquare, Send, User } from 'lucide-react';
import { catalogApi, libraryApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProfile } from '../../context/ProfileContext.jsx';
import AnimeCarousel from '../../components/user/AnimeCarousel.jsx';

export default function AnimeDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [reviewRating, setReviewRating] = useState(9);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { data: anime, isLoading: isAnimeLoading } = useQuery({
    queryKey: ['animeDetail', slug],
    queryFn: () => catalogApi.animeDetail(slug),
  });


  const { data: episodesData, isLoading: isEpisodesLoading } = useQuery({
    queryKey: ['animeEpisodes', slug],
    queryFn: () => catalogApi.episodes(slug),
    enabled: !!slug,
  });

  const { data: listStatus } = useQuery({
    queryKey: ['checkMyList', anime?.id],
    queryFn: () => libraryApi.checkInList(anime.id),
    enabled: !!anime?.id,
  });

  const toggleListMutation = useMutation({
    mutationFn: async () => {
      if (!anime?.id) return;
      if (listStatus?.in_list) await libraryApi.removeFromList(anime.id);
      else await libraryApi.addToList(anime.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkMyList', anime?.id] });
      queryClient.invalidateQueries({ queryKey: ['myList'] });
    },
  });

  const firstGenre = anime?.genres?.[0]?.name || anime?.genres?.[0];
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', firstGenre],
    queryFn: () => catalogApi.animeList({ genre: firstGenre, page_size: 10 }),
    enabled: !!firstGenre,
  });

  const { data: reviewsList = [], refetch: refetchReviews } = useQuery({
    queryKey: ['animeReviews', slug],
    queryFn: () => catalogApi.reviews(slug),
    enabled: !!slug,
  });

  const submitReviewMutation = useMutation({
    mutationFn: (data) => catalogApi.addReview(slug, data),
    onSuccess: () => {
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ['animeDetail', slug] });
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    },
  });


  if (isAnimeLoading) {
    return (
      <div className="min-h-screen bg-background pt-[72px] px-6 lg:px-10 animate-pulse">
        <div className="w-full bg-surface-1 rounded-card" style={{ height: '55vh' }} />
        <div className="mt-8 space-y-4">
          <div className="h-10 w-64 bg-surface-2 rounded" />
          <div className="h-20 w-full max-w-2xl bg-surface-1 rounded" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-h2 font-bold text-text-primary mb-4">Anime not found</h2>
        <Link to="/home" className="text-brand hover:underline text-meta">Return to Home</Link>
      </div>
    );
  }

  const episodesList = Array.isArray(episodesData) ? episodesData : (episodesData?.episodes || []);
  const seasons = anime?.seasons?.length > 0 ? anime.seasons : (episodesData?.seasons || [{ id: 's1', number: 1, title: 'Season 1' }]);
  const currentSeasonEpisodes = episodesList.length > 0 ? episodesList : (seasons[selectedSeasonIndex]?.episodes || []);
  const firstEpisode = currentSeasonEpisodes[0];
  const genres = anime.genres?.map(g => typeof g === 'string' ? g : g.name) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(400px, 55vh, 620px)' }}>
        <img
          src={anime.banner && !anime.banner.includes('1579783900882') ? anime.banner : (anime.poster || '/wallpaper.png')}
          alt={anime.title}
          className="w-full h-full object-cover object-[50%_30%]"
        />
        <div className="absolute inset-0 bg-hero-left" />
        <div className="absolute inset-0 bg-hero-bottom" />
        <div className="absolute inset-0 bg-hero-top" />

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="absolute top-[88px] left-6 lg:left-10 z-20 flex items-center gap-2 px-4 py-2 rounded-btn bg-surface-1/70 hover:bg-surface-2 border border-border-subtle backdrop-blur-sm transition-all text-meta font-medium text-text-secondary">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Content */}
        <div className="absolute bottom-12 left-6 lg:left-10 z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-caption font-semibold uppercase tracking-wider rounded-chip bg-brand-soft text-brand border border-brand/20">
              {anime.type || 'Series'}
            </span>
            {anime.rating && (
              <span className="flex items-center gap-1 text-caption font-semibold px-2.5 py-1 rounded-chip bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {anime.rating}
              </span>
            )}
            {anime.year && <span className="text-caption text-text-muted font-medium px-2 py-1 rounded-chip bg-surface-1/60">{anime.year}</span>}
            {anime.studio && <span className="text-caption text-text-muted font-medium px-2 py-1 rounded-chip bg-surface-1/60">{anime.studio}</span>}
            <span className="text-caption text-text-muted uppercase font-medium px-2 py-1 rounded-chip bg-surface-1/60">{anime.status || 'Completed'}</span>
          </div>

          <h1 className="font-display text-h1 md:text-display tracking-tight text-text-primary">{anime.title}</h1>

          {anime.synopsis && <p className="text-body text-text-secondary line-clamp-3 max-w-xl leading-relaxed">{anime.synopsis}</p>}

          <div className="flex items-center gap-3 pt-2">
            {firstEpisode ? (
              <Link to={`/watch/${slug}/${firstEpisode.id}`}
                className="flex items-center gap-2.5 px-6 py-3 rounded-btn bg-brand hover:bg-brand-hover text-white font-semibold text-[14px] transition-colors">
                <Play className="w-4 h-4 fill-current" /> Play Episode 1
              </Link>
            ) : (
              <button disabled className="flex items-center gap-2.5 px-6 py-3 rounded-btn bg-surface-3 text-text-disabled font-semibold cursor-not-allowed">
                <Play className="w-4 h-4" /> No Episodes
              </button>
            )}
            <button onClick={() => toggleListMutation.mutate()}
              className="flex items-center gap-2 px-5 py-3 rounded-btn bg-surface-2/80 hover:bg-surface-3 border border-border text-text-primary font-medium text-[14px] transition-colors backdrop-blur-sm">
              {listStatus?.in_list
                ? <><Check className="w-4 h-4 text-green-400" /> In My List</>
                : <><Plus className="w-4 h-4 text-brand" /> Add to List</>}
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 lg:px-10 mt-8 space-y-12 max-w-[1440px] mx-auto">
        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-meta font-medium text-text-muted">Genres:</span>
            {genres.map((name, i) => (
              <Link key={i} to={`/browse?genre=${encodeURIComponent(name)}`}
                className="px-3 py-1 text-caption rounded-chip bg-surface-1 hover:bg-brand-soft border border-border-subtle text-text-secondary hover:text-brand transition-colors">
                {name}
              </Link>
            ))}
          </div>
        )}

        {/* Episodes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h2 className="text-h2 font-display font-bold text-text-primary flex items-center gap-3">
              <Film className="w-5 h-5 text-brand" /> Episodes
            </h2>
            {seasons.length > 1 && (
              <div className="flex gap-1.5">
                {seasons.map((s, idx) => (
                  <button key={s.id || idx} onClick={() => setSelectedSeasonIndex(idx)}
                    className={`px-4 py-1.5 text-meta font-semibold rounded-btn transition-colors ${
                      selectedSeasonIndex === idx ? 'bg-brand text-white' : 'bg-surface-1 hover:bg-surface-2 text-text-muted'
                    }`}>
                    {s.title || `Season ${s.number || idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isEpisodesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-44 bg-surface-1 rounded-card animate-pulse" />)}
            </div>
          ) : currentSeasonEpisodes?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentSeasonEpisodes.map((ep) => (
                <Link key={ep.id} to={`/watch/${slug}/${ep.id}`}
                  className="group relative flex flex-col bg-surface-1 hover:bg-surface-2 border border-border-subtle hover:border-border-strong rounded-card overflow-hidden transition-all duration-200">
                  <div className="relative aspect-video w-full overflow-hidden bg-background">
                    <img src={ep.thumbnail || anime.banner || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600'}
                      alt={ep.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-brand/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    {ep.duration && (
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] font-medium bg-black/70 px-2 py-0.5 rounded text-text-secondary">
                        <Clock className="w-3 h-3" /> {ep.duration}m
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-caption text-brand font-semibold">Episode {ep.number}</span>
                    <h3 className="font-semibold text-[14px] text-text-primary group-hover:text-brand transition-colors line-clamp-1">{ep.title}</h3>
                    {ep.synopsis && <p className="text-text-muted text-caption line-clamp-2 leading-relaxed">{ep.synopsis}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-text-muted text-meta">No published episodes in this season yet.</div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations?.results?.length > 0 && (
          <div className="pt-4">
            <AnimeCarousel title="More Like This" items={recommendations.results.filter(a => a.id !== anime.id)} />
          </div>
        )}

        {/* Community Reviews & Ratings */}
        <div className="pt-6 border-t border-border-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-h2 font-display font-bold text-text-primary flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-brand" /> Community Reviews
              </h2>
              <p className="text-text-muted text-meta">
                {reviewsList.length} {reviewsList.length === 1 ? 'review' : 'reviews'} · Audience score: {anime.rating || 'N/A'}/10
              </p>
            </div>
          </div>

          {/* Review Submission Form */}
          {user ? (
            <div className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-body font-semibold text-text-primary">
                  Rate & Review as <span className="text-brand">{activeProfile?.name || user.username}</span>
                </span>
                {/* Star selection (1 to 10) */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-meta text-text-muted mr-1.5 font-medium">Score:</span>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewRating(num)}
                      className={`w-7 h-7 rounded-chip flex items-center justify-center text-[12px] font-bold transition-all ${
                        num <= reviewRating
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-surface-2 text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-amber-400 text-meta flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" /> {reviewRating}/10
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts on the story, animation, character arcs, and pacing..."
                  rows={3}
                  className="w-full bg-surface-2 border border-border rounded-btn p-3.5 text-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                {reviewSuccess ? (
                  <span className="text-green-400 text-meta font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Review posted successfully!
                  </span>
                ) : (
                  <span className="text-text-muted text-caption">
                    Reviews are public to all Mahouten watchers.
                  </span>
                )}
                <button
                  type="button"
                  disabled={submitReviewMutation.isPending || !reviewComment.trim()}
                  onClick={() => submitReviewMutation.mutate({ rating: reviewRating, comment: reviewComment })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-meta font-semibold rounded-btn transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" /> {submitReviewMutation.isPending ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-card bg-surface-1 border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="text-body font-semibold text-text-primary">Sign in to leave a review</p>
                <p className="text-meta text-text-muted">Join the discussion and share your ratings with fellow fans.</p>
              </div>
              <Link
                to="/login"
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-meta font-semibold rounded-btn transition-colors shrink-0"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Reviews List */}
          {reviewsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev) => (
                <div
                  key={rev.id || rev.username}
                  className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-bold text-text-secondary uppercase">
                        {(rev.username || 'U')[0]}
                      </div>
                      <div>
                        <p className="text-meta font-semibold text-text-primary">{rev.username || 'Viewer'}</p>
                        {rev.created_at && (
                          <p className="text-[11px] text-text-muted">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-chip bg-amber-500/10 border border-amber-500/20 text-amber-400 text-caption font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rev.rating}/10</span>
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-body text-text-secondary leading-relaxed">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-1/40 rounded-card border border-border-subtle text-text-muted text-meta">
              No reviews yet. Be the first to share your thoughts on this series!
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
}
