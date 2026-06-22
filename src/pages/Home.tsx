import { Link } from 'react-router';
import './home.css';

export default function Home() {
    return (
        <>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler</h2>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten und Tennisplätze online reservieren.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
                    <p className="home-intro-text">Sie möchten Ihren Verein auf abzumplatz anlegen und die Platzreservierung für Ihre Mitglieder bereitstellen.</p>
                    <p><Link className="button-link" to="/register/club">Verein registrieren</Link></p>
                </div>
            </div>
            <div className="home-feature-layout">
                <img className="hero-image" src="/assets/1.png" alt="screenshot" />
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
