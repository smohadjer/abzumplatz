import Nav from '../nav/Nav';
import { Logout } from "../logout/Logout";

import './style.css';

export default function Header() {
    return (
        <header>
            <Logout />
            <h1>Ab zum Platz</h1>
            <Nav />
        </header>
    )
  }
