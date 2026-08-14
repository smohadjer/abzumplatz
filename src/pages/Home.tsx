import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import './home.css';

export default function Home() {
    const isLoggedIn = useSelector((state: RootState) => state.auth.value);

    return (
        <>
            <p className="home-tagline">Platzreservierung für Tennisvereine</p>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler</h2>
                    <p className="home-intro-subtitle">Immer kostenlos</p>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten und Tennisplätze online reservieren.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
                    <p className="home-intro-subtitle">Kostenloser Basic-Plan verfügbar</p>
                    <p className="home-intro-text">Sie möchten Ihren Verein anlegen und Ihre Plätze und Mitglieder online verwalten.</p>
                    <p><Link className="button-link" to="/register/club">Plan auswählen</Link></p>
                </div>
            </div>
            <div className="home-feature-layout">
                <img className="hero-image" src="/assets/1.png" alt="screenshot" />
                <div className="content">
                    <h2>Was abzumplatz Vereinen bietet:</h2>
                    <ul>
                    <li>Auf jedem Gerät über den Browser nutzbar – ohne App-Installation</li>
                    <li>Kostenlos für Tennisspieler und Vereine mit weniger als 100 aktiven Nutzern</li>
                    <li>Reservieren Sie mehrere Plätze für mehrere Stunden in einer einzigen Buchung, zum Beispiel für Mannschaftsspiele</li>
                    <li>Wiederkehrende Reservierungen, zum Beispiel für wöchentliches Teamtraining</li>
                    <li>Reservierungslimits für Spieler festlegen sowie Reservierungen neu zuweisen, entfernen oder ändern</li>
                    <li>Eigene Vereinsregeln festlegen oder die bereitgestellten Standardregeln verwenden</li>
                    <li>Spieler in deinem Club aktivieren, deaktivieren oder entfernen</li>
                    <li>Sowie viele weitere Funktionen, wie etwa die Möglichkeit, bestimmte Tennisplätze zu sperren, die Öffnungszeiten zu ändern usw.</li>
                    </ul>
                </div>
            </div>
            {!isLoggedIn ? (
                <p className="home-info-links">
                    <Link to="/impressum">Impressum</Link>{' · '}
                    <Link to="/support">Support</Link>
                </p>
            ) : null}
        </>
    )
}
