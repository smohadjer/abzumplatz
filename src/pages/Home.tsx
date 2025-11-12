import { Link } from 'react-router';
import { ImageSlider } from '../components/ImageSlider';
import './home.css';

export default function Home() {
    const slides = [
        {url: '/assets/1-min.jpg', text: 'Registriere als Admin' },
        {url: '/assets/2-min.jpg', text: 'Einloggen und Verein erstellen'},
        {url: '/assets/3-min.jpg', text: 'Plätze reservieren...'}
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
            <p>Abzumplatz ist eine Online-Plattform für Tennisspieler und Tennisvereine. Vereine können ihren Mitgliedern hier die kostenlose Online-Reservierung ihrer Plätze anbieten. Registriere dich als Admin und erstelle nach dem Login einen Account für deinen Verein. Bist du nur Spieler, registriere dich als Spieler und wähle nach dem Login deinen Verein aus.</p>
            <ImageSlider slides={slides} />
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
        </>
    )
}
