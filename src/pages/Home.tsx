import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import './home.css';

export default function Home() {
    const isLoggedIn = useSelector((state: RootState) => state.auth.value);

    return (
        <>
            <h1 className="home-tagline">Die intuitive Plattform für Platzreservierung und Vereinsverwaltung</h1>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler</h2>
                    <p className="home-intro-subtitle">Immer kostenlos</p>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
                    <p className="home-intro-subtitle">Kostenloser Basic-Plan verfügbar</p>
                    <p className="home-intro-text">Sie möchten Ihren Verein einfach online verwalten.</p>
                    <p><Link className="button-link" to="/register/club">Plan auswählen</Link></p>
                </div>
            </div>
            <div className="home-feature-layout">
                <img className="hero-image" src="/assets/screen4.png" alt="screenshot" />
                <div className="content">
                    <h2>Was abzumplatz Vereinen bietet:</h2>
                    <ul>
                    <li>Online-Platzreservierung für Mitglieder</li>
                    <li>Sperrung von Tennisplätzen für Mannschaftsspiele, Turniere und andere Veranstaltungen</li>
                    <li>Einstellungen für Öffnungszeiten, Buchungsdauer, Reservierungslimits und vieles mehr</li>
                    <li>Wiederkehrende Reservierungen für Mannschaftstrainings</li>
                    <li>Interne Vereinsturniere wie Clubmeisterschaften planen, veröffentlichen und verwalten</li>
                    <li>Mitglieder aktivieren, deaktivieren und verwalten</li>
                    <li>Kostenlos starten und nur bei Bedarf auf den Pro-Plan wechseln</li>
                    <li><a href="mailto:support@abzumplatz.de?subject=abzumplatz%3A%20Feedback%20und%20Support">Persönliche Unterstützung</a> bei Fragen und Problemen</li>
                    <li>Einfache Nutzung im Browser – ohne Installation auf Smartphone, Tablet und Computer</li>
                    </ul>
                </div>
            </div>
            {!isLoggedIn ? (
                <p className="home-info-links">
                    <Link to="/impressum">Impressum</Link>{' · '}
                    <Link to="/support">Support</Link>{' · '}
                    <Link to="/faq">FAQ</Link>
                </p>
            ) : null}
        </>
    )
}
