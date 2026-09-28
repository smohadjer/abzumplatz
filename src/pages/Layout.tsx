import { useLayoutEffect } from 'react';
import { Outlet } from "react-router";
import { useLocation } from "react-router";
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import InactiveStatusWarning from '../components/InactiveStatusWarning';
import AppRefreshManager from '../components/AppRefreshManager';

export default function Layout() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (location.pathname === '/') {
      requestAnimationFrame(() => {
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'auto' });
      });
    }
  }, [location.pathname, location.key]);

  return (
    <>
      <AppRefreshManager />
      <Header />
      <main>
        <InactiveStatusWarning />
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
