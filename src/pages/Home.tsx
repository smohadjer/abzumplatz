import { Link } from 'react-router';
import './home.css';

export default function Home() {
    return (
        <>
            <p className="home-tagline">Online Platzreservierung für Tennisvereine</p>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler (kostenlos)</h2>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten und Tennisplätze online reservieren.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
                    <p className="home-intro-text">Sie möchten Ihren Verein anlegen und Plätze für Ihre Mitglieder online reservierbar machen.</p>
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
                    <li>Spieler in deinem Club aktivieren, deaktivieren oder entfernen</li>
                    <li>Sowie viele weitere Funktionen, wie etwa die Möglichkeit, bestimmte Tennisplätze zu sperren, die Öffnungszeiten zu ändern usw.</li>
                    </ul>
                </div>
            </div>
            <p className="home-support-box">Haben Sie Fragen? Senden Sie Ihre Fragen oder Anliegen gerne an <a href="mailto:support@abzumplatz.de">support@abzumplatz.de</a>.</p>
        </>
    )
}
