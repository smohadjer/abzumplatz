import { useState } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { PLAN_CONFIG } from '../planConfig';
import { RootState } from '../store';
import BackButton from '../components/BackButton';
import './faq.css';

type FaqSection = 'players' | 'admins';

export default function Faq() {
    const auth = useSelector((state: RootState) => state.auth);
    const [activeSection, setActiveSection] = useState<FaqSection>(auth.role === 'admin' ? 'admins' : 'players');

    return (
        <>
            {!auth.value ? <p><BackButton /></p> : null}
            <h1>Häufig gestellte Fragen</h1>

            <div className="faq-tabs" aria-label="FAQ-Bereich">
                <button
                    type="button"
                    className={`faq-tab${activeSection === 'players' ? ' faq-tab--active' : ''}`}
                    aria-pressed={activeSection === 'players'}
                    onClick={() => setActiveSection('players')}
                >
                    Spieler
                </button>
                <button
                    type="button"
                    className={`faq-tab${activeSection === 'admins' ? ' faq-tab--active' : ''}`}
                    aria-pressed={activeSection === 'admins'}
                    onClick={() => setActiveSection('admins')}
                >
                    Administratoren
                </button>
            </div>

            {activeSection === 'players' ? (
                <section>
                    <h2>Was kostet abzumplatz für Spieler?</h2>
                    <p>Für Spieler ist abzumplatz immer kostenlos.</p>

                    <h2>Muss ich eine App installieren?</h2>
                    <p>Nein. abzumplatz funktioniert auf Smartphones, Tablets und Computern direkt im Browser.</p>

                    <h2>Wie kann ich meinem Verein beitreten?</h2>
                    <p>
                        Wählen Sie Ihren Verein bei der <Link to="/register/player">Registrierung als Spieler</Link> aus. Anschließend schaltet die Vereinsverwaltung Ihr Konto frei.
                    </p>

                    <h2>Warum kann ich noch keinen Platz reservieren?</h2>
                    <p>Neu registrierte Spielerkonten sind zunächst inaktiv. Sobald die Vereinsverwaltung Ihr Konto freigeschaltet hat, können Sie Plätze reservieren.</p>

                    <h2>Wo kann ich Feedback geben oder ein Problem melden?</h2>
                    <p>Feedback, Verbesserungsvorschläge und Fehlermeldungen können Sie uns über die <Link to="/support">Support-Seite</Link> senden.</p>
                </section>
            ) : (
                <section>
                    <h2>Was kostet abzumplatz für Vereine?</h2>
                    <p>
                        Der Basic-Plan ist kostenlos und enthält die Mitgliederverwaltung und Platzreservierung ohne Mitgliederlimit. Mit dem Pro-Plan für {PLAN_CONFIG.pro.price} € pro Jahr können Vereine zusätzlich Turniere erstellen und Konkurrenzen verwalten.
                    </p>

                    <h2>Gibt es ein Mitgliederlimit?</h2>
                    <p>Nein. Vereine können in allen Plänen beliebig viele Mitglieder verwalten und aktivieren.</p>

                    <h2>Welche Funktionen bietet der Pro-Plan?</h2>
                    <p>Nur Vereine im Pro-Plan können Turniere erstellen, die dafür verwendeten Konkurrenzen verwalten und Benachrichtigungen an ihre Mitglieder senden.</p>

                    <h2>Was können Vereinsadministratoren verwalten?</h2>
                    <p>Administratoren können unter anderem Mitglieder, Tennisplätze, Reservierungen, Öffnungszeiten und Vereinsregeln verwalten.</p>

                    <h2>Wie schalte ich neue Spieler frei?</h2>
                    <p>Neue Spielerkonten erscheinen nach der Registrierung in der Mitgliederverwaltung und können dort aktiviert werden.</p>

                    <h2>Muss ich eine App installieren?</h2>
                    <p>Nein. Die Vereinsverwaltung funktioniert auf Smartphones, Tablets und Computern direkt im Browser.</p>

                    <h2>Wo kann ich Feedback geben oder ein Problem melden?</h2>
                    <p>Feedback, Verbesserungsvorschläge und Fehlermeldungen können Sie uns über die <Link to="/support">Support-Seite</Link> senden.</p>
                </section>
            )}
        </>
    );
}
