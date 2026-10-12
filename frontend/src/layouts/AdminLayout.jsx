import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Film, Video, Users, Tag, Home, FileText,
  LogOut, ChevronLeft, ChevronRight, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Film, label: 'Shows', href: '/admin/shows' },
  { icon: Video, label: 'Episodes', href: '/admin/episodes' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Tag, label: 'Genres', href: '/admin/genres' },
  { icon: Home, label: 'Homepage', href: '/admin/homepage' },
  { icon: FileText, label: 'Audit Log', href: '/admin/audit' },
];

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="relative flex flex-col shrink-0 bg-surface-1 border-r border-border-subtle overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border-subtle shrink-0 min-h-[64px]">
          <div className="w-8 h-8 rounded-card bg-brand flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <span className="font-bold text-meta text-text-primary font-display">Admin Panel</span>
                <p className="text-text-muted text-caption">mahouten.to</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = location.pathname === href || (href === '/admin/dashboard' && location.pathname === '/admin');
            return (
              <Link key={href} to={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-btn transition-colors text-meta font-medium ${active ? 'bg-brand-soft text-brand border border-brand/20' : 'text-text-muted hover:text-text-primary hover:bg-surface-2'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-border-subtle p-3 space-y-1">
          {!collapsed && (
            <div className="px-3 py-1.5">
              <p className="text-meta font-medium text-text-primary truncate">{user?.username}</p>
              <p className="text-caption text-text-muted truncate">{user?.email}</p>
            </div>
          )}
          <button onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-btn text-meta font-medium text-text-muted hover:text-red-400 hover:bg-surface-2 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute top-5 -right-3 z-10 w-6 h-6 bg-surface-2 border border-border rounded-full flex items-center justify-center hover:bg-surface-3 transition-colors">
          {collapsed ? <ChevronRight className="w-3 h-3 text-text-secondary" /> : <ChevronLeft className="w-3 h-3 text-text-secondary" />}
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-[64px] shrink-0 flex items-center justify-between px-6 border-b border-border-subtle bg-surface-1/50 backdrop-blur-sm">
          <h1 className="text-meta font-semibold text-text-primary">
            {navItems.find(n => n.href === location.pathname)?.label || 'Admin Panel'}
          </h1>
          <Link to="/home" className="text-caption text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-btn hover:bg-surface-2">
            <Home className="w-3.5 h-3.5" /> View User App
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
