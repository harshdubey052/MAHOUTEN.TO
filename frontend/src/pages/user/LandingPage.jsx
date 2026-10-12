import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Shield, Zap, Globe, ChevronRight } from 'lucide-react';

const features = [
  { icon: Play, title: 'Instant Streaming', desc: 'Multi-quality HLS streams with zero buffering.' },
  { icon: Shield, title: 'No Ads', desc: 'Pure anime, no interruptions, ever.' },
  { icon: Zap, title: 'New Episodes Fast', desc: 'Updated as soon as episodes air in Japan.' },
  { icon: Globe, title: 'Multi-Language Subs', desc: 'English, Japanese, and more languages.' },
];

const HERO_BG = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1920&auto=format&fit=crop&q=85';
const HERO_BG = '/wallpaper.png';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[rgba(11,12,14,0.92)] backdrop-blur-[16px] border-b border-border-subtle' : 'bg-transparent'
      }`}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-[72px] px-6 lg:px-10">
          <span className="font-display text-[22px] font-bold tracking-tight text-text-primary">
            mahouten<span className="text-brand">.to</span>
          </span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-[14px] font-semibold rounded-btn transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
          <img src={HERO_BG} alt="Mahouten" className="w-full h-full object-cover opacity-50 object-[50%_20%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0C0E]/40 to-[#0B0C0E]/90" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 bg-brand-soft border border-brand/20 text-brand text-[13px] font-semibold px-4 py-1.5 rounded-chip mb-8">
              Now Streaming
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-display tracking-tight text-text-primary mb-6"
          >
            MAHOUTEN
            <span className="text-brand">.TO</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-body-lg text-text-secondary max-w-xl mx-auto mb-4 leading-relaxed"
          >
            The premium anime streaming platform. Cinematic, fast, beautiful.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-body text-text-muted max-w-md mx-auto mb-10"
          >
            Stream thousands of episodes in high quality. Manage your watchlist. Never miss a release.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/register"
              className="flex items-center justify-center gap-2.5 bg-brand hover:bg-brand-hover text-white font-semibold text-[15px] px-8 py-3.5 rounded-btn transition-colors"
            >
              <Play className="w-4 h-4 fill-white" /> Start Watching Free
            </Link>
            <Link
              to="/browse"
              className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary font-medium text-[15px] px-7 py-3.5 rounded-btn transition-colors"
            >
              Browse Catalog <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-surface-1/30">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-h2 font-display font-bold text-text-primary mb-4">Built for Anime Fans</h2>
          <p className="text-body-lg text-text-muted">Everything you need. Nothing you don't.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-surface-1 border border-border-subtle rounded-card p-6 hover:border-border-strong transition-colors"
            >
              <div className="w-10 h-10 bg-brand-soft rounded-card flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand" />
              </div>
              <h3 className="text-text-primary font-semibold text-[15px] mb-2">{title}</h3>
              <p className="text-text-muted text-[13px] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-h2 font-display font-bold text-text-primary mb-4">Ready to watch?</h2>
          <p className="text-body-lg text-text-muted mb-8">Create your free account and start streaming in seconds.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2.5 bg-brand hover:bg-brand-hover text-white font-semibold text-[15px] px-8 py-3.5 rounded-btn transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-[15px] font-semibold text-text-muted">
            mahouten<span className="text-brand">.to</span>
          </span>
          <p className="text-caption text-text-disabled">© 2026 Mahouten. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
