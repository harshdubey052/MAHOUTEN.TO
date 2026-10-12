import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Bell, Bookmark, User, LogOut, Settings, ChevronDown, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

const NAV_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/browse', label: 'Browse' },
  { to: '/search', label: 'Genres' },
  { to: '/history', label: 'History' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { activeProfile, clearProfile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenu, setProfileMenu] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Track scroll for navbar background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setProfileMenu(false);
    clearProfile();
    await logout();
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(11,12,14,0.92)] backdrop-blur-[16px] border-b border-border-subtle'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between h-[72px] px-6 lg:px-10">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-1 select-none">
            <span className="font-display text-[22px] font-bold tracking-tight text-text-primary">
              mahouten<span className="text-brand">.to</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`relative px-3.5 py-2 text-[14px] font-medium rounded-btn transition-colors ${
                    isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-brand rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleSearch}
                className="flex items-center overflow-hidden"
              >
                <div className="flex items-center w-full bg-surface-2 border border-border rounded-btn">
                  <Search className="w-4 h-4 text-text-muted ml-3 shrink-0" />
                  <input
                    ref={searchRef}
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anime, characters, genres..."
                    className="w-full bg-transparent text-text-primary placeholder:text-text-disabled text-[14px] px-3 py-2.5 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="p-2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-text-muted hover:text-text-primary transition-colors rounded-btn hover:bg-surface-2"
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px] stroke-[1.75]" />
              </button>
            )}
          </AnimatePresence>

          {/* Watchlist */}
          {user && (
            <Link
              to="/my-list"
              className="p-2.5 text-text-muted hover:text-text-primary transition-colors rounded-btn hover:bg-surface-2"
              aria-label="Watchlist"
            >
              <Bookmark className="w-[18px] h-[18px] stroke-[1.75]" />
            </Link>
          )}

          {/* YouTube-style Creator Upload Button */}
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 rounded-btn text-[13px] font-semibold transition-all hover:scale-[1.02]"
            title="Upload anime, movie or short clip"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Upload</span>
          </Link>

          {/* Profile Dropdown */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenu(!profileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-btn hover:bg-surface-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-text-secondary text-[13px] font-semibold uppercase">
                  {(activeProfile?.name || user.username)?.[0] || 'U'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${profileMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-surface-2 border border-border rounded-card-lg shadow-xl py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <p className="text-[13px] font-semibold text-text-primary">{activeProfile?.name || user.username}</p>
                      <p className="text-[12px] text-text-muted">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profiles" onClick={() => setProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
                        <User className="w-4 h-4" /> Switch Profile
                      </Link>
                      <Link to="/my-list" onClick={() => setProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
                        <Bookmark className="w-4 h-4" /> Watchlist
                      </Link>
                      <Link to="/history" onClick={() => setProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
                        <Settings className="w-4 h-4" /> Watch History
                      </Link>
                      <Link to="/upload" onClick={() => setProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
                        <Upload className="w-4 h-4 text-brand" /> Upload Studio
                      </Link>
                      <Link to="/settings" onClick={() => setProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-brand hover:bg-surface-3 transition-colors">
                          <Settings className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-border-subtle pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-text-muted hover:text-red-400 hover:bg-surface-3 transition-colors w-full">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 text-[13px] font-semibold text-text-primary bg-brand hover:bg-brand-hover rounded-btn transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-1 border-t border-border-subtle">
        <div className="flex items-center justify-around h-[60px] px-2 pb-[env(safe-area-inset-bottom)]">
          {[
            { to: '/home', icon: '⌂', label: 'Home' },
            { to: '/browse', icon: '◎', label: 'Browse' },
            { to: '/my-list', icon: '♡', label: 'List' },
            { to: '/history', icon: '↻', label: 'History' },
            { to: '/profiles', icon: '◉', label: 'Profile' },
          ].map(({ to, icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-text-muted'
                }`}
              >
                <span className="text-[18px] leading-none">{icon}</span>
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
