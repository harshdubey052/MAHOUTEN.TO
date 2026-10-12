import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  FastForward, Rewind, SkipForward
} from 'lucide-react';

function formatTime(sec) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${m}:${String(ss).padStart(2, '0')}`;
}

export default function VideoPlayer({
  src, title, episodeTitle, subtitles = [],
  introStart = 0, introEnd = 0,
  onProgress, onEnded,
  initialSeconds = 0,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const progressTimerRef = useRef(null);
  const hideControlsTimerRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(initialSeconds);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);

  // Init HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) { hlsRef.current.destroy(); }

    if (Hls.isSupported() && src.includes('.m3u8')) {
      const hls = new Hls({ startLevel: -1 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        video.currentTime = initialSeconds;
        video.play().catch(() => {});
        setPlaying(true);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setCurrentLevel(data.level));
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.currentTime = initialSeconds;
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.src = src;
      video.currentTime = initialSeconds;
      video.play().catch(() => {});
      setPlaying(true);
    }

    // Subtitles
    Array.from(video.querySelectorAll('track')).forEach(t => t.remove());
    subtitles.forEach((sub, i) => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = sub.src;
      track.srclang = sub.lang;
      track.label = sub.label;
      if (i === 0) track.default = true;
      video.appendChild(track);
    });

    return () => { hlsRef.current?.destroy(); clearInterval(progressTimerRef.current); };
  }, [src]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const video = videoRef.current;
      if (!video) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      switch(e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': video.currentTime = Math.min(video.currentTime + 10, duration); break;
        case 'ArrowLeft': video.currentTime = Math.max(video.currentTime - 10, 0); break;
        case 'ArrowUp': e.preventDefault(); setVolume(v => Math.min(v + 0.1, 1)); break;
        case 'ArrowDown': e.preventDefault(); setVolume(v => Math.max(v - 0.1, 0)); break;
        case 'm': setMuted(v => !v); break;
        case 'f': toggleFullscreen(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [duration]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  // Progress reporting every 10 seconds
  useEffect(() => {
    clearInterval(progressTimerRef.current);
    if (playing && onProgress) {
      progressTimerRef.current = setInterval(() => {
        const video = videoRef.current;
        if (video) onProgress(Math.floor(video.currentTime));
      }, 10000);
    }
    return () => clearInterval(progressTimerRef.current);
  }, [playing, onProgress]);

  // Skip intro detection
  useEffect(() => {
    const show = introEnd > 0 && currentTime >= introStart && currentTime < introEnd;
    setShowSkipIntro(show);
  }, [currentTime, introStart, introEnd]);

  const seekPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef}
      className="relative w-full h-full bg-black select-none"
      onMouseMove={resetControlsTimer}
      onClick={togglePlay}
      style={{ cursor: showControls ? 'default' : 'none' }}>

      <video
        ref={videoRef}
        className="w-full h-full"
        volume={volume}
        muted={muted}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => {
          setCurrentTime(e.target.currentTime);
          const b = e.target.buffered;
          if (b.length) setBuffered((b.end(b.length - 1) / e.target.duration) * 100);
        }}
        onDurationChange={(e) => setDuration(e.target.duration || 0)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Skip Intro button */}
      <AnimatePresence>
        {showSkipIntro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-24 right-6 z-20 flex items-center gap-2 bg-surface-2 border border-border text-text-primary font-semibold px-5 py-2.5 rounded-btn hover:bg-surface-3 backdrop-blur-sm transition-colors text-meta"
            onClick={(e) => { e.stopPropagation(); videoRef.current.currentTime = introEnd; }}>
            <SkipForward className="w-4 h-4 text-brand" /> Skip Intro
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-end"
            onClick={(e) => e.stopPropagation()}>

            {/* Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

            <div className="relative px-4 md:px-6 pb-4 space-y-2">
              {/* Seekbar */}
              <div className="relative group/seek">
                {/* Buffered track */}
                <div className="absolute h-1 bg-white/20 rounded-full" style={{ width: `${buffered}%`, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="range" min={0} max={duration || 100} step={0.5}
                  value={currentTime}
                  onChange={(e) => { videoRef.current.currentTime = e.target.value; setCurrentTime(+e.target.value); }}
                  className="w-full h-1 accent-[#D45A43] cursor-pointer"
                  style={{ background: `linear-gradient(to right, #D45A43 ${seekPercent}%, rgba(255,255,255,0.15) ${seekPercent}%)` }}
                />
              </div>

              {/* Control row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => { videoRef.current.currentTime -= 10; }} className="text-white/80 hover:text-white p-1 transition-colors">
                    <Rewind className="w-5 h-5" />
                  </button>
                  <button onClick={togglePlay} className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors">
                    {playing ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black" />}
                  </button>
                  <button onClick={() => { videoRef.current.currentTime += 10; }} className="text-white/80 hover:text-white p-1 transition-colors">
                    <FastForward className="w-5 h-5" />
                  </button>
                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMuted(v => !v)} className="text-white/80 hover:text-white p-1 transition-colors">
                      {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input type="range" min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => { setVolume(+e.target.value); setMuted(false); if (videoRef.current) videoRef.current.volume = +e.target.value; }}
                      className="w-20 h-1 accent-[#D45A43] cursor-pointer hidden md:block"
                    />
                  </div>
                  <span className="text-white/70 text-xs tabular-nums hidden sm:block">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed */}
                  <div className="relative">
                    <button onClick={() => setShowSpeedMenu(v => !v)}
                      className="text-white/80 hover:text-white text-xs font-mono px-2 py-1 border border-white/20 rounded hover:border-[#D45A43] transition-colors">
                      {speed}x
                    </button>
                    <AnimatePresence>
                      {showSpeedMenu && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-surface-2 border border-border rounded-btn overflow-hidden shadow-2xl">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                            <button key={s} onClick={() => { setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; setShowSpeedMenu(false); }}
                              className={`w-full px-4 py-1.5 text-xs text-left transition-colors hover:bg-surface-3 ${speed === s ? 'text-brand font-semibold' : 'text-white'}`}>
                              {s}x
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Quality */}
                  {levels.length > 0 && (
                    <select className="bg-transparent text-white/80 text-xs border border-white/20 rounded px-2 py-1"
                      value={currentLevel}
                      onChange={(e) => { const l = +e.target.value; setCurrentLevel(l); hlsRef.current.currentLevel = l; }}>
                      <option value={-1}>Auto</option>
                      {levels.map((lv, i) => (
                        <option key={i} value={i}>{lv.height}p</option>
                      ))}
                    </select>
                  )}

                  <button onClick={toggleFullscreen} className="text-white/80 hover:text-white p-1 transition-colors">
                    {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
