import { Link } from 'react-router';
import './home.css';

export default function Home() {
    return (
        <div className="navbar">
            <Link to="/login">Anmelden
                <span>wenn Sie sich bereits registriert haben</span>
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
