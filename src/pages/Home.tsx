import { Link } from 'react-router';
import { A11y, Keyboard, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { PLAN_CONFIG } from '../planConfig';
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
            <h1 className="home-tagline">Kostenlose Platzreservierung für Tennisvereine</h1>
            <p className="home-description">Mit abzumplatz verwalten Tennisvereine ihren gesamten Vereinsalltag – von der Online-Platzreservierung bis zur Organisation vereinsinterner Turniere wie Clubmeisterschaften einschließlich Anmeldung und Auslosung. Als Verein behalten Sie den Überblick über Ihre Mitglieder und informieren sie einfach über wichtige Termine und Neuigkeiten.</p>
            <div className="home-intro">
                <div className="home-intro-card">
                    <h2 className="home-intro-label">Für Spieler</h2>
                    <p className="home-intro-text">Sie möchten einem bestehenden Verein beitreten.</p>
                    <p><Link className="button-link" to="/register/player">Als Spieler registrieren</Link></p>
                </div>
                <div className="home-intro-card intro">
                    <h2 className="home-intro-label">Für Vereine</h2>
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
                    <div className="home-plan-features">
                        <section className="home-plan-feature-group">
                            <h3 className="home-feature-heading">Kostenlos im Basic-Plan</h3>
                            <ul className="home-feature-list">
                                {PLAN_CONFIG.basic.features.map(feature => (
                                    <li className={`home-feature--${feature.icon}`} key={feature.icon}>{feature.label}</li>
                                ))}
                            </ul>
                        </section>
                        <section className="home-plan-feature-group">
                            <h3 className="home-feature-heading home-feature-heading--pro">Im Pro-Plan enthalten</h3>
                            <ul className="home-feature-list">
                                {PLAN_CONFIG.pro.features.map(feature => (
                                    <li className={`home-feature--${feature.icon}`} key={feature.icon}>{feature.label}</li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}
