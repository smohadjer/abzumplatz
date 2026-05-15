import { Outlet } from "react-router";
import Footer from '../components/footer/Footer';

export default function Layout() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
