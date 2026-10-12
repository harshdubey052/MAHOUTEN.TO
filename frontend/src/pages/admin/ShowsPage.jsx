import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film, Plus, Search, Edit2, Trash2, X, Upload, Star, CheckCircle, AlertCircle
} from 'lucide-react';
import { adminApi, catalogApi } from '../../api/index.js';

export default function ShowsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    synopsis: '',
    type: 'series',
    status: 'ongoing',
    year: new Date().getFullYear(),
    studio: '',
    rating: '8.0',
    trailer_url: '',
    featured: false,
    publish_status: 'published',
  });
  const [posterFile, setPosterFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  // Fetch shows
  const { data: showsData, isLoading } = useQuery({
    queryKey: ['adminShows', search, page],
    queryFn: () => adminApi.shows({ search: search || undefined, page }),
  });

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (posterFile) fd.append('poster', posterFile);
      if (bannerFile) fd.append('banner', bannerFile);

      if (editingShow) {
        return adminApi.updateShow(editingShow.id, fd);
      } else {
        return adminApi.createShow(fd);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
      closeModal();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
      setDeleteId(null);
    },
  });

  const openAddModal = () => {
    setEditingShow(null);
    setFormData({
      title: '',
      slug: '',
      synopsis: '',
      type: 'series',
      status: 'ongoing',
      year: new Date().getFullYear(),
      studio: '',
      rating: '8.0',
      trailer_url: '',
      featured: false,
      publish_status: 'published',
    });
    setPosterFile(null);
    setBannerFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (show) => {
    setEditingShow(show);
    setFormData({
      title: show.title || '',
      slug: show.slug || '',
      synopsis: show.synopsis || '',
      type: show.type || 'series',
      status: show.status || 'ongoing',
      year: show.year || new Date().getFullYear(),
      studio: show.studio || '',
      rating: show.rating || '8.0',
      trailer_url: show.trailer_url || '',
      featured: !!show.featured,
      publish_status: show.publish_status || 'published',
    });
    setPosterFile(null);
    setBannerFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShow(null);
  };

  const showsList = showsData?.results || (Array.isArray(showsData) ? showsData : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Anime Catalog</h1>
          <p className="text-zinc-400 text-sm">Create, publish, edit, and organize anime titles.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Anime
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-surface-border">
        <Search className="w-5 h-5 text-zinc-400 ml-2" />
        <input
          type="text"
          placeholder="Filter anime by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
        />
      </div>

      {/* Shows Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-surface-card text-xs uppercase font-semibold text-zinc-400 border-b border-surface-border">
              <tr>
                <th className="px-6 py-4">Show</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-14 bg-surface/40" />
                  </tr>
                ))
              ) : showsList.length > 0 ? (
                showsList.map((show) => (
                  <tr key={show.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={show.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100'}
                        alt={show.title}
                        className="w-10 h-14 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white line-clamp-1">{show.title}</p>
                        <p className="text-xs text-zinc-500">{show.studio || 'Studio N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase text-xs font-bold text-purple-400">
                      {show.type || 'Series'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                        {show.status || 'Ongoing'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          show.publish_status === 'published'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}
                      >
                        {show.publish_status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{show.year || '—'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(show)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                        title="Edit Show"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(show.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-700 transition-colors"
                        title="Delete Show"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No anime titles found. Click "Add Anime" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface border border-surface-border rounded-3xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingShow ? 'Edit Anime' : 'Add New Anime'}
                </h2>
                <button onClick={closeModal} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Frieren: Beyond Journey's End"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Synopsis</label>
                  <textarea
                    rows={3}
                    value={formData.synopsis}
                    onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    placeholder="Synopsis / overview of the anime..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="series">Series</option>
                      <option value="movie">Movie</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Publish</label>
                    <select
                      value={formData.publish_status}
                      onChange={(e) => setFormData({ ...formData, publish_status: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Studio</label>
                    <input
                      type="text"
                      value={formData.studio}
                      onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Madhouse"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Rating</label>
                    <input
                      type="text"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. 8.9"
                    />
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Poster Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files[0])}
                      className="text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Banner Backdrop</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files[0])}
                      className="text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl bg-surface-card hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !formData.title}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30"
                >
                  {saveMutation.isPending ? 'Saving...' : editingShow ? 'Update Show' : 'Create Show'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg text-white">Delete Anime Show?</h3>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Are you sure you want to delete this show? All associated seasons and episode references will also be removed.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl bg-surface-card text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteId)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

