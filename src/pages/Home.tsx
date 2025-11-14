import { Link } from 'react-router';
import { Slider } from '../components/slider/slider';
import './home.css';

export default function Home() {
    const slides = [
        {url: '/assets/1-min.jpg', text: 'Registrieren Sie sich als Vereinsadmin' },
        {url: '/assets/2-min.jpg', text: 'Nach dem Einloggen wird Ihnen die Club-Registrierungsseite angezeigt'},
        {url: '/assets/3-min.jpg', text: 'Sie und Ihre Vereinsmitglieder können jetzt Plätze buchen.'}
    ];

    return (
        <>
            <div className="navbar">
                <Link to="/login">Anmelden
                    <span>Wenn Sie bereits registriert sind</span>
                </Link>
                <Link to="/register">Registrieren
                    <span>Für Erstbenutzer</span>
                </Link>
                {/* <Link to="/register/club">Verein Registrieren
                    <span>Für Clubadministratoren</span>
                </Link> */}
            </div>
            <p className="content">Abzumplatz ist eine Online-Plattform, die es Tennisvereinen ermöglicht, ihren Mitgliedern die kostenlose Reservierung von Plätzen anzubieten und alle Aspekte der Buchung über den Administrator abzuwickeln.</p>
            <Slider slides={slides} />
            <div className="content">
                <h3>Funktionen:</h3>
                <ul>
                    <li>Einfache, intuitive Benutzeroberfläche, die auf allen Geräten funktioniert</li>
                    <li>Kostenlose und unbegrenzte Buchung Ihrer Plätze für Vereinsmitglieder</li>
                    <li>Möglichkeit zur Festlegung verschiedener Reservierungsbeschränkungen</li>
                    <li>Wiederkehrende Buchungen für Training und andere Zwecke</li>
                    <li>Sperrung von Plätzen für Mannschaftsspiele</li>
                    <li>Echtzeit-Statistiken zu Ihren Mitgliedern und der Platznutzung direkt in der App</li>
                </ul>
                <p className="tagline">Made mit ❤️ für 🎾 in Freiburg</p>
            </div>
        </>
    )
}
