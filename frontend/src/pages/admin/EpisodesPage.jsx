import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlaySquare, Plus, Edit2, Trash2, X, Upload, Link as LinkIcon, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { adminApi } from '../../api/index.js';

export default function EpisodesPage() {
  const queryClient = useQueryClient();
  const [selectedShow, setSelectedShow] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form states
  const [videoSourceType, setVideoSourceType] = useState('url'); // 'url' | 'upload'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [formData, setFormData] = useState({
    show: '',
    season: '',
    number: 1,
    title: '',
    synopsis: '',
    duration: 24,
    hls_url: '',
    intro_start: 0,
    intro_end: 90,
    publish_status: 'published',
  });

  // Bulk add state
  const [bulkRows, setBulkRows] = useState([
    { number: 1, title: 'Episode 1', hls_url: '', duration: 24 },
    { number: 2, title: 'Episode 2', hls_url: '', duration: 24 },
    { number: 3, title: 'Episode 3', hls_url: '', duration: 24 },
  ]);

  // Fetch all shows for selector
  const { data: showsData } = useQuery({
    queryKey: ['adminShowsList'],
    queryFn: () => adminApi.shows({ page_size: 100 }),
  });
  const shows = showsData?.results || (Array.isArray(showsData) ? showsData : []);

  // Fetch seasons for selected show
  const { data: seasonsData } = useQuery({
    queryKey: ['adminSeasons', selectedShow],
    queryFn: () => adminApi.seasons(selectedShow),
    enabled: !!selectedShow,
  });
  const seasons = Array.isArray(seasonsData) ? seasonsData : seasonsData?.results || [];

  // Fetch episodes
  const { data: episodesData, isLoading } = useQuery({
    queryKey: ['adminEpisodes', selectedShow, selectedSeason],
    queryFn: () =>
      adminApi.episodes({
        show: selectedShow || undefined,
        season: selectedSeason || undefined,
      }),
  });
  const episodes = episodesData?.results || (Array.isArray(episodesData) ? episodesData : []);

  // Save Episode mutation
  const saveEpisodeMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        show: selectedShow,
        season: selectedSeason,
      };

      let res;
      if (editingEpisode) {
        res = await adminApi.updateEpisode(editingEpisode.id, payload);
      } else {
        res = await adminApi.createEpisode(payload);
      }

      // If video file is selected for upload, upload it to the episode
      if (videoSourceType === 'upload' && videoFile && res.data?.id) {
        const fd = new FormData();
        fd.append('video', videoFile);
        await adminApi.uploadVideo(res.data.id, fd, (progress) => {
          setUploadProgress(progress);
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEpisodes'] });
      closeAddModal();
    },
  });

  // Bulk Add mutation
  const bulkMutation = useMutation({
    mutationFn: () =>
      adminApi.bulkEpisodes({
        show: selectedShow,
        season: selectedSeason,
        episodes: bulkRows.filter((r) => r.title && r.hls_url),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEpisodes'] });
      setIsBulkModalOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteEpisode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEpisodes'] });
      setDeleteId(null);
    },
  });

  const openAddModal = () => {
    setEditingEpisode(null);
    setUploadProgress(0);
    setVideoFile(null);
    setFormData({
      show: selectedShow,
      season: selectedSeason,
      number: (episodes.length || 0) + 1,
      title: `Episode ${(episodes.length || 0) + 1}`,
      synopsis: '',
      duration: 24,
      hls_url: '',
      intro_start: 0,
      intro_end: 90,
      publish_status: 'published',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (ep) => {
    setEditingEpisode(ep);
    setFormData({
      show: ep.show || selectedShow,
      season: ep.season || selectedSeason,
      number: ep.number || 1,
      title: ep.title || '',
      synopsis: ep.synopsis || '',
      duration: ep.duration || 24,
      hls_url: ep.hls_url || '',
      intro_start: ep.intro_start || 0,
      intro_end: ep.intro_end || 90,
      publish_status: ep.publish_status || 'published',
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEditingEpisode(null);
    setUploadProgress(0);
  };

  const addBulkRow = () => {
    setBulkRows([
      ...bulkRows,
      {
        number: bulkRows.length + 1,
        title: `Episode ${bulkRows.length + 1}`,
        hls_url: '',
        duration: 24,
      },
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Episodes Management</h1>
          <p className="text-zinc-400 text-sm">
            Add single streams, batch ingest episodes, or upload raw videos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            disabled={!selectedShow}
            className="px-4 py-2.5 rounded-xl bg-surface border border-surface-border hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 font-semibold text-xs transition-all"
          >
            Bulk Ingest
          </button>
          <button
            onClick={openAddModal}
            disabled={!selectedShow}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Episode
          </button>
        </div>
      </div>

      {/* Show & Season Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-4 rounded-2xl border border-surface-border">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Anime Show</label>
          <select
            value={selectedShow}
            onChange={(e) => {
              setSelectedShow(e.target.value);
              setSelectedSeason('');
            }}
            className="w-full px-3.5 py-2.5 bg-surface-card border border-surface-border rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">-- Choose a Show --</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Season (Optional)</label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            disabled={!selectedShow}
            className="w-full px-3.5 py-2.5 bg-surface-card border border-surface-border rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-purple-500 disabled:opacity-40"
          >
            <option value="">All Seasons</option>
            {seasons.map((sn, i) => (
              <option key={sn.id || i} value={sn.id}>
                {sn.title || `Season ${sn.number || i + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Episodes Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-surface-card text-xs uppercase font-semibold text-zinc-400 border-b border-surface-border">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Episode Title</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Stream URL / File</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-14 bg-surface/40" />
                  </tr>
                ))
              ) : episodes.length > 0 ? (
                episodes.map((ep) => (
                  <tr key={ep.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-purple-400">
                      {ep.number}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{ep.title}</td>
                    <td className="px-6 py-4 text-zinc-400">{ep.duration}m</td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400 max-w-xs truncate">
                      {ep.hls_url || 'Video Uploaded'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                        Ready
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(ep)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(ep.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    {selectedShow
                      ? 'No episodes found for this selection. Click "Add Episode" or "Bulk Ingest".'
                      : 'Please select a show from the dropdown above to view its episodes.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Episode Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-surface border border-surface-border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingEpisode ? 'Edit Episode' : 'Add New Episode'}
                </h2>
                <button onClick={closeAddModal} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Ep. #</label>
                    <input
                      type="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Source Selection Tabs */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Video Source</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('url')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        videoSourceType === 'url'
                          ? 'bg-purple-600 text-white'
                          : 'bg-surface-card text-zinc-400'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> HLS / MP4 URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        videoSourceType === 'upload'
                          ? 'bg-purple-600 text-white'
                          : 'bg-surface-card text-zinc-400'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload File (FFmpeg)
                    </button>
                  </div>

                  {videoSourceType === 'url' ? (
                    <input
                      type="text"
                      placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                      value={formData.hls_url}
                      onChange={(e) => setFormData({ ...formData, hls_url: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="video/mp4,video/mkv,video/webm"
                        onChange={(e) => setVideoFile(e.target.files[0])}
                        className="text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30"
                      />
                      {uploadProgress > 0 && (
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-purple-600 h-2 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Intro Start (s)</label>
                    <input
                      type="number"
                      value={formData.intro_start}
                      onChange={(e) => setFormData({ ...formData, intro_start: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Intro End (s)</label>
                    <input
                      type="number"
                      value={formData.intro_end}
                      onChange={(e) => setFormData({ ...formData, intro_end: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 rounded-xl bg-surface-card text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveEpisodeMutation.mutate()}
                  disabled={saveEpisodeMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  {saveEpisodeMutation.isPending ? 'Saving...' : 'Save Episode'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Ingest Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-surface border border-surface-border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white">Bulk Ingest Episodes</h2>
                <button onClick={() => setIsBulkModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={row.number}
                      onChange={(e) => {
                        const next = [...bulkRows];
                        next[idx].number = Number(e.target.value);
                        setBulkRows(next);
                      }}
                      className="w-16 px-2.5 py-2 bg-surface-card border border-surface-border rounded-xl text-white text-xs font-mono"
                      placeholder="#"
                    />
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => {
                        const next = [...bulkRows];
                        next[idx].title = e.target.value;
                        setBulkRows(next);
                      }}
                      className="w-48 px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white text-xs font-semibold"
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={row.hls_url}
                      onChange={(e) => {
                        const next = [...bulkRows];
                        next[idx].hls_url = e.target.value;
                        setBulkRows(next);
                      }}
                      className="flex-1 px-3 py-2 bg-surface-card border border-surface-border rounded-xl text-white text-xs font-mono"
                      placeholder="HLS / Stream URL"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBulkRow}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold pt-1"
                >
                  + Add another row
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-card text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => bulkMutation.mutate()}
                  disabled={bulkMutation.isPending}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  {bulkMutation.isPending ? 'Ingesting...' : 'Ingest All Episodes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Episode Confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-lg text-white">Delete Episode?</h3>
              <p className="text-zinc-400 text-xs">
                This will permanently delete the episode record and its watch progress.
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
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

