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
                <img className="hero-image" src="/assets/screen4.png" alt="screenshot" />
                <div className="content">
                    <h2>Was abzumplatz Vereinen bietet:</h2>
                    <ul>
                    <li>Ohne Installation auf Smartphone, Tablet und Computer nutzbar</li>
                    <li>Kostenloser Basic-Plan für Vereine mit bis zu 100 aktiven Mitgliedern</li>
                    <li>Einzelne, mehrstündige und wiederkehrende Reservierungen verwalten</li>
                    <li>Mehrere Plätze gleichzeitig reservieren, beispielsweise für Mannschaftsspiele</li>
                    <li>Mitglieder aktivieren, deaktivieren und verwalten</li>
                    <li>Reservierungslimits, Öffnungszeiten und verfügbare Plätze festlegen</li>
                    <li>Eigene Vereinsregeln erstellen oder Standardregeln verwenden</li>
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
