import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import './home.css';

export default function Home() {
    const isLoggedIn = useSelector((state: RootState) => state.auth.value);

    return (
        <>
            <p className="home-tagline">Platzreservierung und Turnierverwaltung für Tennisvereine</p>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler</h2>
                    <p className="home-intro-subtitle">Immer kostenlos</p>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten, Tennisplätze reservieren und an internen Vereinsturnieren teilnehmen.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
                    <p className="home-intro-subtitle">Kostenloser Basic-Plan verfügbar</p>
                    <p className="home-intro-text">Sie möchten Ihren Verein anlegen und Plätze, Mitglieder und interne Vereinsturniere online verwalten.</p>
                    <p><Link className="button-link" to="/register/club">Plan auswählen</Link></p>
                </div>
            </div>
            <div className="home-feature-layout">
                <img className="hero-image" src="/assets/screen4.png" alt="screenshot" />
                <div className="content">
                    <h2>Was abzumplatz Vereinen bietet:</h2>
                    <ul>
                    <li>Tennisplätze online reservieren und einzelne, mehrstündige, wiederkehrende oder gleichzeitige Reservierungen mehrerer Plätze verwalten, beispielsweise für Mannschaftsspiele</li>
                    <li>Interne Vereinsturniere wie Clubmeisterschaften planen, veröffentlichen und verwalten</li>
                    <li>Mitglieder aktivieren, deaktivieren und verwalten</li>
                    <li>Reservierungslimits, Öffnungszeiten und verfügbare Plätze festlegen</li>
                    <li>Eigene Vereinsregeln erstellen oder Standardregeln verwenden</li>
                    <li>Ohne Installation auf Smartphone, Tablet und Computer nutzbar</li>
                    <li>Kostenloser Basic-Plan mit bis zu 100 aktiven Mitgliederkonten</li>
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
