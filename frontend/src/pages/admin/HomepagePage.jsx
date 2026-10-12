import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Plus, Edit2, Trash2, X } from 'lucide-react';
import { adminApi } from '../../api/index.js';

export default function HomepagePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(0);

  // Fetch homepage rows
  const { data: rowsData, isLoading } = useQuery({
    queryKey: ['adminHomepageRows'],
    queryFn: () => adminApi.homepageRows(),
  });

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { title, order: Number(order) };
      if (editingRow) {
        return adminApi.updateRow(editingRow.id, payload);
      } else {
        return adminApi.createRow(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHomepageRows'] });
      closeModal();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteRow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHomepageRows'] });
    },
  });

  const openAddModal = () => {
    setEditingRow(null);
    setTitle('');
    setOrder((rows.length || 0) + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setTitle(row.title || '');
    setOrder(row.order || 0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRow(null);
  };

  const rows = Array.isArray(rowsData) ? rowsData : rowsData?.results || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Homepage Layout</h1>
          <p className="text-zinc-400 text-sm">
            Curate carousel sections and ordered rows displayed on the main user landing.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Row
        </button>
      </div>

      {/* Rows Table */}
      <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-surface-card text-xs uppercase font-semibold text-zinc-400 border-b border-surface-border">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Section Title</th>
                <th className="px-6 py-4">Titles Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-14 bg-surface/40" />
                  </tr>
                ))
              ) : rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-purple-400">
                      {row.order}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{row.title}</td>
                    <td className="px-6 py-4 text-zinc-400">
                      {row.anime?.length || row.anime_count || 0} anime
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(row.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No custom rows created.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingRow ? 'Edit Section Row' : 'Create Section Row'}
                </h2>
                <button onClick={closeModal} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Row Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Trending Now, Editor's Picks"
                    className="w-full px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-surface-card text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={!title.trim() || saveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Row'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

