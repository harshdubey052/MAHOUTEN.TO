import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-background text-text-primary flex flex-col">
      <Navbar />
      <main className="w-full flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
