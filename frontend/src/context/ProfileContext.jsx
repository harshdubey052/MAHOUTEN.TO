import React, { createContext, useContext, useState, useCallback } from 'react';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [activeProfile, setActiveProfileState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('active_profile')); } catch { return null; }
  });

  const setActiveProfile = useCallback((profile) => {
    localStorage.setItem('active_profile', JSON.stringify(profile));
    setActiveProfileState(profile);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem('active_profile');
    setActiveProfileState(null);
  }, []);

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be inside ProfileProvider');
  return ctx;
};

