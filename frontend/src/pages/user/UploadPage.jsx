import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Film, Sparkles, Image, Video, Check, AlertCircle,
  Play, Tag, Calendar, User, Star, Shield, ArrowRight, X,
  Clock, Link as LinkIcon, FileVideo, Eye, RefreshCw
} from 'lucide-react';
import { catalogApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProfile } from '../../context/ProfileContext.jsx';

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Fantasy', 'Sci-Fi', 'Supernatural',
  'Romance', 'Psychological', 'Drama', 'Comedy', 'Mystery',
  'Horror', 'Shounen', 'Slice of Life', 'Short Clip', 'AMV'
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  // Content type: series, movie, clip
  const [contentType, setContentType] = useState('clip');

  // Form fields
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState(['Action', 'Short Clip']);
  const [year, setYear] = useState(new Date().getFullYear());
  const [studio, setStudio] = useState(activeProfile?.name || user?.username || 'Otaku Studio');
  const [rating, setRating] = useState('8.5');
  const [ageRating, setAgeRating] = useState('PG-13');
  const [duration, setDuration] = useState('180'); // in seconds

  // Media
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  // Auto-fill state
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  // Upload progress and status
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [publishedData, setPublishedData] = useState(null);

  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Auto-fill handler
  const handleAutofill = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsAutofilling(true);
    setErrorMessage('');
    try {
      const data = await catalogApi.autofill(searchQuery.trim());
      if (data) {
        setTitle(data.title || searchQuery);
        setSynopsis(data.synopsis || '');
        if (data.poster) {
          setPosterUrl(data.poster);
          setPosterPreview(data.poster);
        }
        if (data.banner) {
          setBannerUrl(data.banner);
          setBannerPreview(data.banner);
        }
        if (data.genres && Array.isArray(data.genres)) {
          setSelectedGenres(data.genres.slice(0, 6));
        }
        if (data.year) setYear(data.year);
        if (data.studio) setStudio(data.studio);
        if (data.rating) setRating(String(data.rating));
        if (data.age_rating) setAgeRating(data.age_rating);
        if (data.type) setContentType(data.type);
        setAutofillSuccess(true);
        setTimeout(() => setAutofillSuccess(false), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Could not find title on anime database. You can fill details manually.');
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (!title) {
        // Strip extension for title suggestion
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handlePosterFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const url = URL.createObjectURL(file);
      setPosterPreview(url);
    }
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    }
  };

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a title');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', synopsis.trim());
      formData.append('type', contentType);
      formData.append('genres', JSON.stringify(selectedGenres));
      formData.append('year', String(year));
      formData.append('studio', studio.trim());
      formData.append('rating', rating);
      formData.append('age_rating', ageRating);
      formData.append('duration', String(duration));
      formData.append('creator', activeProfile?.name || user?.username || 'Creator');

      if (videoFile) {
        formData.append('video_file', videoFile);
      } else if (videoUrl.trim()) {
        formData.append('video_url', videoUrl.trim());
      }

      if (posterFile) {
        formData.append('poster_file', posterFile);
      } else if (posterUrl.trim()) {
        formData.append('poster', posterUrl.trim());
      }

      if (bannerFile) {
        formData.append('banner_file', bannerFile);
      } else if (bannerUrl.trim()) {
        formData.append('banner', bannerUrl.trim());
      }

      const res = await catalogApi.studioUpload(formData, (progress) => {
        setUploadProgress(Math.max(10, progress));
      });

      setUploadProgress(100);
      setPublishedData(res);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to upload title. Please check your fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-[88px] pb-24 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1380px] mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-brand px-2.5 py-0.5 rounded-chip bg-brand/10 border border-brand/20">
                Creator Studio
              </span>
              <span className="text-text-muted text-[13px]">• YouTube-style Uploader</span>
            </div>
            <h1 className="text-h1 font-display font-bold text-text-primary">
              Upload Anime, Movie or Short Clip
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="px-4 py-2 text-[14px] text-text-secondary hover:text-text-primary border border-border rounded-btn transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:hover:bg-brand text-white text-[14px] font-semibold rounded-btn transition-all shadow-lg shadow-brand/20"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing {uploadProgress > 0 ? `${uploadProgress}%` : ''}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publish to Platform</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-card bg-red-500/10 border border-red-500/20 text-red-400 text-[14px] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="p-1 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Smart Auto-fill Bar (MAL / AniList) */}
        <div className="mb-8 p-5 rounded-card-lg bg-surface-1 border border-border-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Smart Auto-Fill from Anime Database
                </h3>
              </div>
              <p className="text-[13px] text-text-muted">
                Type any anime name (e.g. <i>Jujutsu Kaisen, Demon Slayer, Chainsaw Man</i>) to auto-populate description, HD banner, poster, and tags.
              </p>
            </div>

            <form onSubmit={handleAutofill} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime title..."
                className="w-full md:w-72 bg-surface-2 border border-border rounded-btn px-3.5 py-2 text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={isAutofilling || !searchQuery.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-surface-3 hover:bg-surface-4 disabled:opacity-40 text-text-primary text-[13px] font-semibold rounded-btn border border-border transition-colors shrink-0"
              >
                {isAutofilling ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                ) : autofillSuccess ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-brand" />
                )}
                <span>{isAutofilling ? 'Fetching...' : autofillSuccess ? 'Auto-filled!' : 'Auto-fill'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Two-Column Studio Layout (Left Form, Right Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Content Type Selector */}
            <div className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-3">
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-text-muted">
                1. What are you uploading?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'clip', label: 'Short Clip / AMV', desc: 'Highlights, edits & shorts' },
                  { id: 'movie', label: 'Feature Movie', desc: 'Full length film' },
                  { id: 'series', label: 'Anime Series', desc: 'TV Series episode' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setContentType(t.id);
                      if (t.id === 'clip') setDuration('180');
                      if (t.id === 'movie') setDuration('5400');
                      if (t.id === 'series') setDuration('1440');
                    }}
                    className={`p-3.5 rounded-card border text-left transition-all ${
                      contentType === t.id
                        ? 'bg-brand/10 border-brand text-text-primary ring-1 ring-brand'
                        : 'bg-surface-2 border-border hover:bg-surface-3 text-text-secondary'
                    }`}
                  >
                    <div className="font-semibold text-[14px]">{t.label}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Video File / Stream Source */}
            <div className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-semibold uppercase tracking-wider text-text-muted">
                  2. Video Source
                </label>
                <span className="text-[12px] text-text-muted">MP4, WebM, MKV or HLS .m3u8</span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => videoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-card-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  videoFile
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/60 bg-surface-2/60'
                }`}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <FileVideo className={`w-10 h-10 mb-2 ${videoFile ? 'text-brand' : 'text-text-muted'}`} />
                {videoFile ? (
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary">{videoFile.name}</p>
                    <p className="text-[12px] text-text-muted mt-1">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • Click to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">
                      Drag and drop video file, or <span className="text-brand font-semibold">Browse</span>
                    </p>
                    <p className="text-[12px] text-text-muted mt-1">Supports full HD videos and short clips</p>
                  </div>
                )}
              </div>

              {/* Or Stream URL */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-[12px] font-medium text-text-secondary">Or paste video / HLS URL:</span>
                </div>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                  className="w-full bg-surface-2 border border-border rounded-btn px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Leave empty to use high-quality default test stream.
                </p>
              </div>
            </div>

            {/* Video Details: Title & Description */}
            <div className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-4">
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-text-muted">
                3. Details
              </label>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-medium text-text-primary">Title (Required)</label>
                  <span className="text-[11px] text-text-muted">{title.length}/100</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gojo Satoru Awakening • Hollow Purple Epic Scene"
                  className="w-full bg-surface-2 border border-border rounded-btn px-4 py-3 text-[15px] font-medium text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-medium text-text-primary">Description / Synopsis</label>
                  <span className="text-[11px] text-text-muted">{synopsis.length}/5000</span>
                </div>
                <textarea
                  rows={5}
                  maxLength={5000}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Tell viewers what this video or anime is about..."
                  className="w-full bg-surface-2 border border-border rounded-btn p-3.5 text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand leading-relaxed"
                />
              </div>
            </div>

            {/* Thumbnails & Artwork */}
            <div className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-4">
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-text-muted">
                4. Visuals & Artwork
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Poster / Thumbnail */}
                <div className="space-y-2">
                  <span className="text-[13px] font-medium text-text-secondary">Portrait Poster (2:3)</span>
                  <div
                    onClick={() => posterInputRef.current?.click()}
                    className="border border-dashed border-border hover:border-brand rounded-card p-4 text-center cursor-pointer bg-surface-2/40 flex flex-col items-center justify-center h-32"
                  >
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePosterFileChange}
                      className="hidden"
                    />
                    <Image className="w-6 h-6 text-text-muted mb-1" />
                    <span className="text-[12px] text-text-secondary">Upload poster image</span>
                  </div>
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => {
                      setPosterUrl(e.target.value);
                      setPosterPreview(e.target.value);
                    }}
                    placeholder="Or enter poster image URL"
                    className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-[12px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Landscape Banner */}
                <div className="space-y-2">
                  <span className="text-[13px] font-medium text-text-secondary">Landscape Banner (16:9)</span>
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    className="border border-dashed border-border hover:border-brand rounded-card p-4 text-center cursor-pointer bg-surface-2/40 flex flex-col items-center justify-center h-32"
                  >
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="hidden"
                    />
                    <Image className="w-6 h-6 text-text-muted mb-1" />
                    <span className="text-[12px] text-text-secondary">Upload 16:9 banner</span>
                  </div>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => {
                      setBannerUrl(e.target.value);
                      setBannerPreview(e.target.value);
                    }}
                    placeholder="Or enter banner image URL"
                    className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-[12px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            {/* Categories, Tags & Metadata */}
            <div className="p-5 rounded-card bg-surface-1 border border-border-subtle space-y-4">
              <label className="block text-[13px] font-semibold uppercase tracking-wider text-text-muted">
                5. Tags & Classification
              </label>

              {/* Genre Pills */}
              <div>
                <span className="text-[13px] font-medium text-text-secondary block mb-2">Genres & Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_GENRES.map((g) => {
                    const isSelected = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1 text-[12px] font-medium rounded-chip transition-colors ${
                          isSelected
                            ? 'bg-brand text-white'
                            : 'bg-surface-2 hover:bg-surface-3 text-text-secondary border border-border'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Studio, Year, Rating */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="text-[12px] text-text-muted block mb-1">Creator / Studio</label>
                  <input
                    type="text"
                    value={studio}
                    onChange={(e) => setStudio(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-text-muted block mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-text-muted block mb-1">Rating (0-10)</label>
                  <input
                    type="text"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-text-muted block mb-1">Age Rating</label>
                  <select
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-brand"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R-17+">R-17+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live YouTube-Style Video Card Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-[100px] space-y-6">
              <div className="p-5 rounded-card-lg bg-surface-1 border border-border-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-brand" />
                    <span className="text-[13px] font-semibold text-text-primary uppercase tracking-wider">
                      Live Preview
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">How it appears to viewers</span>
                </div>

                {/* Video / Banner Preview Player Card */}
                <div className="rounded-card overflow-hidden bg-black border border-border-subtle group">
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-3">
                    <img
                      src={bannerPreview || posterPreview || '/wallpaper.png'}
                      alt={title || 'Preview'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-brand/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Duration pill */}
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-muted" />
                      <span>{Math.floor(Number(duration) / 60)}:{String(Number(duration) % 60).padStart(2, '0')}</span>
                    </div>

                    {/* Content Type badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-brand text-white text-[10px] font-bold uppercase tracking-wider">
                      {contentType}
                    </div>
                  </div>

                  {/* Video Meta row */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-[15px] font-semibold text-text-primary line-clamp-2 leading-snug">
                      {title || 'Untiled Video / Anime'}
                    </h4>

                    <div className="flex items-center gap-2 text-[12px] text-text-muted">
                      <div className="w-5 h-5 rounded-full bg-surface-3 border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary uppercase">
                        {(studio || 'U')[0]}
                      </div>
                      <span className="font-medium text-text-secondary">{studio}</span>
                      <span>•</span>
                      <span>{year}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {rating}
                      </span>
                    </div>

                    {synopsis && (
                      <p className="text-[12px] text-text-muted line-clamp-3 leading-relaxed pt-1">
                        {synopsis}
                      </p>
                    )}

                    {selectedGenres.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {selectedGenres.slice(0, 4).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-text-secondary border border-border-subtle"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim()}
                  className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-semibold rounded-btn text-[14px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand/15"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading ({uploadProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Publish {title ? `"${title.slice(0, 20)}..."` : 'Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {publishedData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-surface-1 border border-border rounded-card-lg p-6 space-y-6 shadow-2xl"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-h3 font-display font-bold text-text-primary">
                    Published Successfully!
                  </h3>
                  <p className="text-[14px] text-text-muted">
                    Your {contentType} is now live and available on Mahouten.to.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-card border border-border">
                  <img
                    src={publishedData.anime?.poster || posterPreview || '/wallpaper.png'}
                    alt=""
                    className="w-14 h-20 object-cover rounded"
                  />
                  <div className="space-y-1">
                    <h4 className="text-[14px] font-semibold text-text-primary line-clamp-1">
                      {publishedData.anime?.title || title}
                    </h4>
                    <p className="text-[12px] text-text-muted">
                      {publishedData.anime?.studio || studio} • {year}
                    </p>
                    <span className="inline-block text-[11px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded">
                      Ready to stream
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate(publishedData.watch_url)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand hover:bg-brand-hover text-white font-semibold text-[14px] rounded-btn transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Now</span>
                  </button>
                  <button
                    onClick={() => navigate(publishedData.detail_url)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary font-medium text-[14px] rounded-btn transition-colors"
                  >
                    <span>View Page</span>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setPublishedData(null);
                      setTitle('');
                      setSynopsis('');
                      setVideoFile(null);
                      setPosterFile(null);
                      setBannerFile(null);
                    }}
                    className="text-[13px] text-text-muted hover:text-text-primary transition-colors"
                  >
                    + Upload another video
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

