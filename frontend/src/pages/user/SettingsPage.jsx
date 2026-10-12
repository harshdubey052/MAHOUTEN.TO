import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProfile } from '../../context/ProfileContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, authApi } from '../../api/index.js';
import { User, Shield, Bell, Palette, ChevronRight, Check, Loader2, Edit2 } from 'lucide-react';

const AVATAR_COLORS = {
  avatar_1: '#D45A43',
  avatar_2: '#4A78A9',
  avatar_3: '#7B6B8D',
  avatar_4: '#3A8A6E',
  avatar_admin: '#B08D57',
};

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-meta font-semibold uppercase tracking-[0.1em] text-text-muted border-b border-border-subtle pb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-surface-1 border border-border-subtle rounded-card">
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-text-primary">{label}</p>
        {desc && <p className="text-meta text-text-muted mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeProfile, setActiveProfile } = useProfile();
  const qc = useQueryClient();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(activeProfile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(activeProfile?.avatar || 'avatar_1');
  const [saveMsg, setSaveMsg] = useState('');

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profileApi.list().then(r => r.data),
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, data }) => profileApi.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      setActiveProfile(res.data);
      setEditingProfile(false);
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 2500);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pt-[96px] pb-24 px-6 lg:px-10"
    >
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-meta font-semibold uppercase tracking-[0.1em] text-brand">Account</span>
          <h1 className="text-h2 font-display font-bold text-text-primary">Settings</h1>
        </div>

        {/* Account info */}
        <Section title="Account">
          <SettingRow label="Email" desc="Your login email">
            <span className="text-meta text-text-secondary">{user?.email}</span>
          </SettingRow>
          <SettingRow label="Username" desc="Your display name">
            <span className="text-meta text-text-secondary">{user?.username}</span>
          </SettingRow>
          <SettingRow label="Role" desc="Access level">
            <span className={`text-meta font-semibold ${user?.role === 'admin' ? 'text-brand' : 'text-text-secondary'}`}>
              {user?.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
          </SettingRow>
        </Section>

        {/* Active profile */}
        <Section title="Active Profile">
          {!editingProfile ? (
            <div className="flex items-center justify-between gap-4 py-4 px-4 bg-surface-1 border border-border-subtle rounded-card">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-card flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: AVATAR_COLORS[activeProfile?.avatar] || '#D45A43' }}
                >
                  {(activeProfile?.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-body font-semibold text-text-primary">{activeProfile?.name}</p>
                  <p className="text-meta text-text-muted">Active profile</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setProfileName(activeProfile?.name || '');
                  setSelectedAvatar(activeProfile?.avatar || 'avatar_1');
                  setEditingProfile(true);
                }}
                className="flex items-center gap-1.5 text-meta text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-btn hover:bg-surface-2"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          ) : (
            <div className="p-4 bg-surface-1 border border-brand/30 rounded-card space-y-4">
              <p className="text-meta font-semibold text-text-primary">Edit Profile</p>
              {/* Avatar picker */}
              <div className="flex gap-2">
                {Object.entries(AVATAR_COLORS).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAvatar(key)}
                    className={`w-9 h-9 rounded-card flex items-center justify-center text-sm font-bold text-white transition-all ${selectedAvatar === key ? 'ring-2 ring-brand ring-offset-2 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                  >
                    {key[7]?.toUpperCase() || 'A'}
                  </button>
                ))}
              </div>
              {/* Name input */}
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Profile name"
                className="w-full bg-surface-2 border border-border text-text-primary rounded-btn px-3 py-2.5 text-body focus:outline-none focus:border-brand transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateProfile.mutate({ id: activeProfile.id, data: { name: profileName, avatar: selectedAvatar } })}
                  disabled={updateProfile.isPending || !profileName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-meta font-semibold rounded-btn transition-colors disabled:opacity-50"
                >
                  {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-muted text-meta rounded-btn transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {saveMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-meta text-green-400 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> {saveMsg}
            </motion.p>
          )}
        </Section>

        {/* All profiles */}
        <Section title="All Profiles">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProfile(p);
                  setSaveMsg(`Switched to ${p.name}`);
                  setTimeout(() => setSaveMsg(''), 2500);
                }}
                className={`flex items-center gap-3 p-3 rounded-card border transition-all text-left ${
                  activeProfile?.id === p.id
                    ? 'bg-brand-soft border-brand/30 text-brand'
                    : 'bg-surface-1 border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-chip flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: AVATAR_COLORS[p.avatar] || '#D45A43' }}
                >
                  {(p.name || 'U')[0].toUpperCase()}
                </div>
                <span className="text-meta font-medium truncate">{p.name}</span>
                {activeProfile?.id === p.id && <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-brand" />}
              </button>
            ))}
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SettingRow label="Autoplay" desc="Automatically play next episode">
            <div className="w-10 h-5 bg-brand rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
            </div>
          </SettingRow>
          <SettingRow label="Video Quality" desc="Default streaming quality">
            <span className="text-meta text-text-secondary">Auto (Best)</span>
          </SettingRow>
          <SettingRow label="Subtitles" desc="Default subtitle language">
            <span className="text-meta text-text-secondary">English</span>
          </SettingRow>
        </Section>
      </div>
    </motion.div>
  );
}

