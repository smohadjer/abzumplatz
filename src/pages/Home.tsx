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
            <div className="home-feature-layout">
                <img className="hero-image" src="/assets/1.png" alt="screenshot" />
                {/* <Slider slides={slides} /> */}
                <div className="content">
                    <h2>Was abzumplatz Ihnen bietet:</h2>
                    <ul>
                    <li>Tennisplätze online reservieren in wenigen Sekunden</li>
                    <li>Klarer Tageskalender für freie und belegte Plätze</li>
                    <li>Buchungen selbst verwalten und schnell ändern</li>
                    <li>Neue Mitglieder einfach registrieren und freischalten</li>
                    <li>Trainings, Turniere und Serienbuchungen mit wenig Aufwand planen</li>
                    <li>Flexible Regeln für Plätze, Zeiten und Buchungslimits</li>
                    <li>Direkt im Browser ohne App</li>
                    </ul>
                </div>
            </div>
        </>
    )
}
