import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicFooter from '../components/layout/PublicFooter';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 text-midnight-900 selection:bg-cobalt-500 selection:text-white">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;

