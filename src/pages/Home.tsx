import { Link } from 'react-router';

export default function Home() {
    return (
        <div className="navbar">
            <Link to="/login">Spieler Anmelden</Link>
            <Link to="/register">Spieler Registrieren</Link>
            <Link to="/register/club">Verein Registrieren</Link>
        </div>
    )
}
