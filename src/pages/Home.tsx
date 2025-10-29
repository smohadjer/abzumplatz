import { Link } from 'react-router';
import './home.css';

export default function Home() {
    return (
        <>
            <div className="navbar">
                <Link to="/login">Anmelden
                    <span>Für Spieler, die bereits registriert sind</span>
                </Link>
                <Link to="/register">Registrieren
                    <span>Für Erstbenutzer</span>
                </Link>
                {/* <Link to="/register/club">Verein Registrieren
                    <span>Für Clubadministratoren</span>
                </Link> */}
            </div>
            <p>Abzumplatz ist eine Online-Plattform für Tennisspieler und Tennisvereine. Vereine können ihren Mitgliedern hier die kostenlose Online-Reservierung ihrer Plätze anbieten. Registriere dich als Admin und erstelle nach dem Login einen Account für deinen Verein. Bist du nur Spieler, registriere dich als Spieler und wähle nach dem Login deinen Verein aus. Du kannst deinen Account und alle deine Daten jederzeit löschen.</p>
        </>
    )
}
