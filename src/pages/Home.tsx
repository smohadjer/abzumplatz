import { Link } from 'react-router';
import Header from '../components/header/Header';
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
            <Header />
            <div className="navbar">
                <p><Link className="button" to="/login">Anmelden</Link></p>
                <p>Neuer Spieler? <Link className="navbar-text-link" to="/register/player">Jetzt registrieren</Link></p>
            </div>
            <p className="intro">Abzumplatz ermöglicht es Tennisvereinen, ihren Mitgliedern kostenlose Online-Reservierungen ihrer Tennisplätze anzubieten. <Link className="button" to="/register/club">Registrieren Sie Ihren Verein</Link> und teilen Sie den Link mit Ihren Vereinsmitgliedern.</p>
            <img className="hero-image" src="/assets/1.png" alt="screenshot" />
            {/* <Slider slides={slides} /> */}
            <div className="content">
                <h2>Was abzumplatz Ihnen bietet:</h2>
                <ul>
                <li>Mitglieder buchen freie Plätze jederzeit online, auch bequem am Smartphone.</li>
                <li>Der übersichtliche Tageskalender zeigt sofort, welche Plätze verfügbar oder reserviert sind.</li>
                <li>Spieler behalten ihre aktiven Reservierungen im Blick und können eigene Buchungen selbst löschen.</li>
                <li>Vereine steuern Reservierungszeiten, verfügbare Plätze und die maximale Anzahl aktiver Buchungen pro Spieler.</li>
                <li>Administratoren verwalten Mitglieder, aktivieren neue Spieler und deaktivieren Nutzer bei Bedarf.</li>
                <li>Administratoren erstellen Trainings-, Turnier- oder Sonderbuchungen in einem Schritt: über mehrere Plätze, mehrere Stunden und auf Wunsch jede Woche wiederkehrend.</li>
                <li>Passwort vergessen? Mitglieder erhalten einen sicheren Link zum Zurücksetzen per E-Mail.</li>
                <li>Abzumplatz läuft direkt im Browser und ist für Tennisvereine kostenlos nutzbar.</li>
                </ul>
            </div>
        </>
    )
}
