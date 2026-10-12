import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserRoute, AdminRoute, GuestRoute, AuthRequiredRoute } from './guards/RouteGuards.jsx'
import UserLayout from './layouts/UserLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'

// Lazy-load pages for code splitting
const LandingPage    = lazy(() => import('./pages/user/LandingPage.jsx'))
const LoginPage      = lazy(() => import('./pages/user/AuthPages.jsx').then(m => ({ default: m.LoginPage })))
const RegisterPage   = lazy(() => import('./pages/user/AuthPages.jsx').then(m => ({ default: m.RegisterPage })))
const ProfilesPage   = lazy(() => import('./pages/user/ProfilesPage.jsx'))
const HomePage       = lazy(() => import('./pages/user/HomePage.jsx'))
const AnimeDetailPage= lazy(() => import('./pages/user/AnimeDetailPage.jsx'))
const WatchPage      = lazy(() => import('./pages/user/WatchPage.jsx'))
const SearchPage     = lazy(() => import('./pages/user/SearchPage.jsx'))
const BrowsePage     = lazy(() => import('./pages/user/BrowsePage.jsx'))
const MyListPage     = lazy(() => import('./pages/user/MyListPage.jsx'))
const HistoryPage    = lazy(() => import('./pages/user/HistoryPage.jsx'))
const UploadPage     = lazy(() => import('./pages/user/UploadPage.jsx'))
const SettingsPage   = lazy(() => import('./pages/user/SettingsPage.jsx'))
const NotFoundPage   = lazy(() => import('./pages/user/NotFoundPage.jsx'))

// Admin pages
const DashboardPage  = lazy(() => import('./pages/admin/DashboardPage.jsx'))
const ShowsPage      = lazy(() => import('./pages/admin/ShowsPage.jsx'))
const EpisodesPage   = lazy(() => import('./pages/admin/EpisodesPage.jsx'))
const UsersPage      = lazy(() => import('./pages/admin/UsersPage.jsx'))
const GenresPage     = lazy(() => import('./pages/admin/GenresPage.jsx'))
const HomepagePage   = lazy(() => import('./pages/admin/HomepagePage.jsx'))
const AuditPage      = lazy(() => import('./pages/admin/AuditPage.jsx'))

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Guest-only routes */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Profile selection (requires auth, no layout) */}
        <Route path="/profiles" element={<AuthRequiredRoute><ProfilesPage /></AuthRequiredRoute>} />

        {/* User app routes */}
        <Route element={<UserLayout />}>
          <Route path="/home" element={<UserRoute><HomePage /></UserRoute>} />
          <Route path="/anime/:slug" element={<AnimeDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/my-list" element={<UserRoute><MyListPage /></UserRoute>} />
          <Route path="/history" element={<UserRoute><HistoryPage /></UserRoute>} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/settings" element={<UserRoute><SettingsPage /></UserRoute>} />
        </Route>

        {/* Watch page (full screen, no layout) */}
        <Route path="/watch/:animeSlug/:episodeId" element={<UserRoute><WatchPage /></UserRoute>} />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="shows" element={<ShowsPage />} />
          <Route path="episodes" element={<EpisodesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="genres" element={<GenresPage />} />
          <Route path="homepage" element={<HomepagePage />} />
          <Route path="audit" element={<AuditPage />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
