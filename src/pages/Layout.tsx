import { Outlet } from "react-router";
import Header from '../components/header/Header';

import './layout.css';

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <footer>&copy; 2025 Saeid Mohadjer</footer>
    </>
  )
}
