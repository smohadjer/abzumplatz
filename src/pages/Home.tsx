import { Link } from 'react-router';
import './home.css';

export default function Home() {
    return (
        <div className="navbar">
            <Link to="/login">Anmelden
                <span>Für Spieler, die bereits registriert sind</span>
            </Link>
            <Link to="/register">Registrieren
                <span>Für Erstbenutzer</span>
            </Link>
            <Link to="/register/club">Verein Registrieren
                <span>Für Clubadministratoren</span>
            </Link>
        </div>
    )
}
