import { Link } from 'react-router';
import Header from '../components/header/Header';
import { PLAN_CONFIG, getPaidPlanDurationLabel } from '../planConfig';
// import { Slider } from '../components/slider/slider';
import './home.css';

export default function Home() {
    const planCards = [
        {
            key: 'basic',
            title: PLAN_CONFIG.basic.label,
            price: `${PLAN_CONFIG.basic.price} €${getPaidPlanDurationLabel('basic')}`,
            members: `Bis zu ${PLAN_CONFIG.basic.membersLimit} aktive Mitglieder`,
            notes: [
                'Online-Reservierungen für Ihren Verein',
                'Mitglieder selbst freischalten',
                'Ideal für kleinere Vereine',
            ]
        },
        {
            key: 'pro',
            title: PLAN_CONFIG.pro.label,
            price: `${PLAN_CONFIG.pro.price} €${getPaidPlanDurationLabel('pro')}`,
            members: `Bis zu ${PLAN_CONFIG.pro.membersLimit} aktive Mitglieder`,
            notes: [
                'Mehr Mitglieder im laufenden Betrieb',
                'Alle Funktionen des Basic Plans',
                'Monatlich kündbar',
            ]
        },
        {
            key: 'elite',
            title: PLAN_CONFIG.elite.label,
            price: `${PLAN_CONFIG.elite.price} €${getPaidPlanDurationLabel('elite')}`,
            members: 'Keine Begrenzung der aktiven Mitglieder',
            notes: [
                'Für große Vereine ohne Limit',
                'Alle Funktionen des Pro Plans',
                'Monatlich kündbar',
            ]
        }
    ];

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
            <section className="plan-section" aria-labelledby="plan-section-title">
                <div className="plan-section-heading">
                    <h2 id="plan-section-title">Pläne im Überblick</h2>
                    <p>Wählen Sie den Plan, der zur Größe Ihres Vereins passt.</p>
                </div>
                <div className="plan-grid">
                    {planCards.map(plan => (
                        <article key={plan.key} className={`plan-card plan-card--${plan.key}`}>
                            <p className="plan-card-name">{plan.title}</p>
                            <p className="plan-card-price">{plan.price}</p>
                            <p className="plan-card-members">{plan.members}</p>
                            <ul className="plan-card-list">
                                {plan.notes.map(note => <li key={note}>{note}</li>)}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
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
