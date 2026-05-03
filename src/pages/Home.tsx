import { Link } from 'react-router';
// import { Slider } from '../components/slider/slider';
import './home.css';

export default function Home() {
    // const slides = [
    //     {url: '/assets/1-min.jpg', text: 'Registrieren Sie sich als Vereinsadmin' },
    //     {url: '/assets/2-min.jpg', text: 'Nach dem Einloggen wird Ihnen die Club-Registrierungsseite angezeigt'},
    //     {url: '/assets/3-min.jpg', text: 'Sie und Ihre Vereinsmitglieder können jetzt Plätze buchen.'}
    // ];

    return (
        <>
            <div className="navbar">
                <div className="navbar-login">
                    <Link to="/login">Anmelden</Link>
                    <Link className="navbar-text-link" to="/register/player">Mit E-Mail registerieren</Link>
                </div>
            </div>
            <p className="intro">Abzumplatz ermöglicht es Tennisvereinen, ihren Mitgliedern kostenlose Online-Reservierungen ihrer Tennisplätze anzubieten.</p>
            <p className="club-register"><Link to="/register/club">Verein registrieren</Link></p>
            <img className="hero-image" src="/assets/1.png" alt="screenshot" />
            {/* <Slider slides={slides} /> */}
            <div className="content">
                <h2>Was abzumplatz Ihnen bietet:</h2>
                <ul>
                <li>Kostenlose Online-Platzreservierung für Tennisvereine</li>
                <li>Einfache Registrierung für Vereine und Spieler</li>
                <li>Übersichtlicher Buchungskalender für alle Tennisplätze</li>
                <li>Schnelle Platzbuchung für Mitglieder</li>
                <li>Anzeige eigener Buchungen</li>
                <li>Verwaltung von Vereinsmitgliedern</li>
                <li>Aktivieren und Deaktivieren von Spielern</li>
                <li>Flexible Verwaltung der Anzahl verfügbarer Plätze</li>
                <li>Sperren und Freigeben einzelner Tennisplätze</li>
                <li>Einstellbare Reservierungszeiten pro Verein</li>
                <li>Begrenzung aktiver Buchungen pro Spieler</li>
                <li>Wiederkehrende Buchungen für Training und regelmäßige Termine</li>
                <li>Erweiterte Buchungsrechte für Vereinsadministratoren</li>
                <li>Zentrale Übersicht aller Reservierungen im Verein</li>
                <li>Club-spezifische Daten und Berechtigungen</li>
                <li>Mobile-freundliche Nutzung im Browser</li>
                </ul>
            </div>
        </>
    )
}
