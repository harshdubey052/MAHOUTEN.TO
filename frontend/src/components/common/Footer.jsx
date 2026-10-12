import React from 'react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  {
    heading: 'Browse',
    links: [
      { label: 'All Anime', to: '/browse' },
      { label: 'Movies', to: '/browse?type=movie' },
      { label: 'Short Clips', to: '/browse?type=clip' },
      { label: 'New Releases', to: '/browse?ordering=-created_at' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'My Watchlist', to: '/my-list' },
      { label: 'Watch History', to: '/history' },
      { label: 'Upload Studio', to: '/upload' },
      { label: 'Settings', to: '/settings' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Search', to: '/search' },
      { label: 'Genres', to: '/search' },
      { label: 'Switch Profile', to: '/profiles' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface-1/30 backdrop-blur-sm mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/home" className="inline-block">
              <span className="font-display text-[20px] font-bold text-text-primary">
                mahouten<span className="text-brand">.to</span>
              </span>
            </Link>
            <p className="text-caption text-text-muted leading-relaxed max-w-[200px]">
              Premium anime streaming. Dark cinematic design, built for fans.
            </p>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading} className="space-y-3">
              <p className="text-caption font-semibold uppercase tracking-[0.1em] text-text-muted">{heading}</p>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-caption text-text-disabled hover:text-text-secondary transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-caption text-text-disabled">
            © {new Date().getFullYear()} Mahouten. All rights reserved.
          </p>
          <p className="text-caption text-text-disabled">
            Built with passion for the anime community.
          </p>
        </div>
      </div>
    </footer>
  );
}

