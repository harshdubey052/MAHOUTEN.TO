import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 space-y-6 max-w-lg"
      >
        {/* 404 number */}
        <div className="relative">
          <p className="font-display font-bold text-[140px] leading-none text-text-primary/5 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-1">
              <p className="font-display text-h2 font-bold text-brand">404</p>
              <p className="text-body text-text-muted">Page Not Found</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <h1 className="text-h3 font-display font-semibold text-text-primary">
            Lost in the Void
          </h1>
          <p className="text-body text-text-secondary max-w-sm mx-auto leading-relaxed">
            The page you're looking for doesn't exist, was removed, or never existed in this realm.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary font-medium text-body rounded-btn transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link
            to="/home"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold text-body rounded-btn transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link
            to="/browse"
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-1 hover:bg-surface-2 border border-border text-text-secondary font-medium text-body rounded-btn transition-colors"
          >
            <Search className="w-4 h-4" /> Browse
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

