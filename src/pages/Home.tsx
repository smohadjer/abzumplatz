import { Link } from 'react-router';
import { A11y, Keyboard, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import './home.css';

const screenshots = [
    { src: '/assets/home/localhost-reservations(iPhone SE).png', alt: 'Übersicht der Tennisplatzreservierungen' },
    { src: '/assets/home/localhost-bookings(iPhone SE).png', alt: 'Buchungsübersicht eines Mitglieds' },
    { src: '/assets/home/localhost-bookings-news.png', alt: 'Vereinsmeldungen in abzumplatz' },
    { src: '/assets/home/localhost-tournaments(iPhone SE).png', alt: 'Übersicht der Vereinsturniere' },
    { src: '/assets/home/localhost-admin(iPhone SE).png', alt: 'Vereinsverwaltung für Administratoren' },
];

export default function Home() {
    return (
        <>
            <h1 className="home-tagline">Die intuitive Plattform für Tennisplatzreservierung und Vereinsverwaltung</h1>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler</h2>
                    <p className="home-intro-subtitle">Immer kostenlos</p>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
                    <p className="home-intro-subtitle">Kostenloser Basic-Plan verfügbar</p>
                    <p className="home-intro-text">Sie möchten Ihren Verein einfach online verwalten.</p>
                    <p><Link className="button-link" to="/register/club">Plan auswählen</Link></p>
                </div>
            </div>
            <div className="home-feature-layout">
                <figure
                    className="home-screenshot-slider"
                    aria-label="Einblicke in abzumplatz"
                >
                    <Swiper
                        className="home-screenshot-frame"
                        modules={[A11y, Keyboard, Pagination]}
                        pagination={{ clickable: true }}
                        keyboard={{ enabled: true }}
                        grabCursor
                    >
                        {screenshots.map((screenshot) => (
                            <SwiperSlide key={screenshot.src}>
                                <img
                                    className="home-screenshot"
                                    src={screenshot.src}
                                    alt={screenshot.alt}
                                    draggable="false"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </figure>
                <div className="content">
                    <h2>Was abzumplatz Vereinen bietet:</h2>
                    <ul className="home-feature-list">
                    <li>Online-Platzreservierung für Mitglieder</li>
                    <li>Tennisplätze für Mannschaftsspiele, Turniere und andere Veranstaltungen sperren</li>
                    <li>Buchungsregeln flexibel festlegen – von Öffnungszeiten und Buchungsdauer bis zu Reservierungslimits</li>
                    <li>Wiederkehrende Reservierungen für Mannschaftstrainings einrichten</li>
                    <li>Vereinsturniere wie Clubmeisterschaften organisieren – mit einfacher Anmeldung für Mitglieder direkt in der App</li>
                    <li>Mitglieder mit In-App-Benachrichtigungen über wichtige Vereinsmeldungen informieren</li>
                    <li>Den Mitgliederbestand jederzeit aktuell im Blick behalten und Mitglieder einfach aktivieren, deaktivieren oder entfernen</li>
                    <li>Direkt im Browser auf Smartphone, Tablet und Computer nutzen – ohne Installation</li>
                    <li>Kostenlos starten und nur bei Bedarf auf den Pro-Plan wechseln</li>
                    <li>Persönliche Unterstützung bei Fragen und Problemen</li>
                    </ul>
                </div>
            </div>
        </>
    )
}
