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
                <Link to="/login">Anmelden</Link>
                <Link to="/register">Registrieren
                    <span>Für Spieler und Vereinsadmin</span>
                </Link>
                {/* <Link to="/register/club">Verein Registrieren
                    <span>Für Clubadministratoren</span>
                </Link> */}
            </div>
            <p className="intro">Abzumplatz ermöglicht es Tennisvereinen, ihren Mitgliedern kostenlose Online-Reservierungen ihrer Tennisplätze anzubieten.</p>
            <img className="hero-image" src="/assets/1.png" alt="screenshot" />
            {/* <Slider slides={slides} /> */}
            <div className="content">
                <h2>Funktionen für Vereinsadministratoren</h2>
                <ul>
                    <li>Möglichkeit zur Festlegung verschiedener Reservierungsbeschränkungen</li>
                    <li>Wiederkehrende Buchungen für Training und andere Zwecke</li>
                    <li>Möglichkeit zum Sperren und Entsperren einzelner Tennisplätze</li>
                    <li>Übersicht aller registrierten Mitglieder</li>
                </ul>
                <p className="tagline">Made mit ❤️ für 🎾 in Freiburg</p>
            </div>
        </>
    )
}
