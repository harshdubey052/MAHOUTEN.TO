import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Check, X, Loader2 } from 'lucide-react';

const AVATARS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_admin'];
const AVATAR_COLORS = {
  avatar_1: 'bg-[#D45A43]',
  avatar_2: 'bg-[#4A78A9]',
  avatar_3: 'bg-[#7B6B8D]',
  avatar_4: 'bg-[#3A8A6E]',
  avatar_admin: 'bg-[#B08D57]',
};
const AVATAR_INITIALS = { avatar_1: 'A', avatar_2: 'B', avatar_3: 'C', avatar_4: 'D', avatar_admin: 'M' };

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setActiveProfile } = useProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAvatar, setAddAvatar] = useState('avatar_1');

  const { data: profiles = [], isLoading, isError } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profileApi.list().then(r => r.data),
    retry: 1,
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, data }) => profileApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); setEditing(null); },
  });

  const createProfile = useMutation({
    mutationFn: (data) => profileApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); setAdding(false); setAddName(''); },
  });

  const selectProfile = (profile) => {
    setActiveProfile(profile);
    navigate('/home');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
      <p className="text-text-muted text-meta">Loading profiles...</p>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-red-400 text-meta">Session expired or unable to load profiles.</p>
      <button onClick={() => { logout(); navigate('/login'); }}
        className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-btn text-meta font-semibold transition-colors">
        Return to Login
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-h2 font-display font-bold text-text-primary mb-2">Who's watching?</h1>
        <p className="text-text-muted text-body">Select your profile to continue</p>
      </motion.div>

      <div className="flex flex-wrap items-start justify-center gap-8 max-w-2xl">
        {profiles.map((profile, i) => (
          <motion.div key={profile.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col items-center gap-3 group">
            {editing === profile.id ? (
              <div className="flex flex-col items-center gap-3">
                <div className={`w-20 h-20 rounded-card ${AVATAR_COLORS[selectedAvatar]} flex items-center justify-center text-2xl font-bold text-white`}>
                  {AVATAR_INITIALS[selectedAvatar]}
                </div>
                <div className="flex gap-1.5">
                  {AVATARS.map(av => (
                    <button key={av} onClick={() => setSelectedAvatar(av)}
                      className={`w-7 h-7 rounded-chip ${AVATAR_COLORS[av]} flex items-center justify-center text-[10px] text-white font-bold ${selectedAvatar === av ? 'ring-2 ring-brand ring-offset-2 ring-offset-background' : ''}`}>
                      {AVATAR_INITIALS[av]}
                    </button>
                  ))}
                </div>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  className="bg-surface-1 border border-border text-text-primary text-meta rounded-btn px-3 py-2 w-32 focus:outline-none focus:border-brand text-center" />
                <div className="flex gap-2">
                  <button onClick={() => updateProfile.mutate({ id: profile.id, data: { name: newName, avatar: selectedAvatar } })}
                    className="p-1.5 bg-brand rounded-chip hover:bg-brand-hover transition-colors">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 bg-surface-3 rounded-chip hover:bg-surface-4 transition-colors">
                    <X className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative cursor-pointer" onClick={() => selectProfile(profile)}>
                  <div className={`w-20 h-20 rounded-card ${AVATAR_COLORS[profile.avatar] || AVATAR_COLORS.avatar_1} flex items-center justify-center text-2xl font-bold text-white transition-all duration-200 group-hover:ring-3 group-hover:ring-brand/60 group-hover:ring-offset-3 group-hover:ring-offset-background`}>
                    {(profile.name || 'U')[0].toUpperCase()}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(profile.id); setNewName(profile.name); setSelectedAvatar(profile.avatar); }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-surface-2 border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-3">
                    <Edit2 className="w-3 h-3 text-text-secondary" />
                  </button>
                </div>
                <span className="text-text-secondary text-meta font-medium group-hover:text-text-primary transition-colors">
                  {profile.name}
                </span>
              </>
            )}
          </motion.div>
        ))}

        {/* Add Profile */}
        {profiles.length < 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: profiles.length * 0.06 }}
            className="flex flex-col items-center gap-3">
            {adding ? (
              <div className="flex flex-col items-center gap-3">
                <div className={`w-20 h-20 rounded-card ${AVATAR_COLORS[addAvatar]} flex items-center justify-center text-2xl font-bold text-white`}>
                  {AVATAR_INITIALS[addAvatar]}
                </div>
                <div className="flex gap-1.5">
                  {AVATARS.map(av => (
                    <button key={av} onClick={() => setAddAvatar(av)}
                      className={`w-7 h-7 rounded-chip ${AVATAR_COLORS[av]} flex items-center justify-center text-[10px] text-white font-bold ${addAvatar === av ? 'ring-2 ring-brand ring-offset-2 ring-offset-background' : ''}`}>
                      {AVATAR_INITIALS[av]}
                    </button>
                  ))}
                </div>
                <input autoFocus value={addName} onChange={e => setAddName(e.target.value)} placeholder="Profile name"
                  className="bg-surface-1 border border-border text-text-primary text-meta rounded-btn px-3 py-2 w-32 focus:outline-none focus:border-brand text-center placeholder:text-text-disabled" />
                <div className="flex gap-2">
                  <button disabled={!addName.trim()}
                    onClick={() => createProfile.mutate({ name: addName, avatar: addAvatar })}
                    className="p-1.5 bg-brand rounded-chip hover:bg-brand-hover transition-colors disabled:opacity-50">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={() => setAdding(false)} className="p-1.5 bg-surface-3 rounded-chip hover:bg-surface-4 transition-colors">
                    <X className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => setAdding(true)}
                  className="w-20 h-20 rounded-card border-2 border-dashed border-border hover:border-brand flex items-center justify-center transition-all group/add">
                  <Plus className="w-7 h-7 text-text-muted group-hover/add:text-brand transition-colors" />
                </button>
                <span className="text-text-muted text-meta">Add Profile</span>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
