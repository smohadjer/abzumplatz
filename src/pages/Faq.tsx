import { useState } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { PLAN_CONFIG } from '../planConfig';
import { RootState } from '../store';
import './faq.css';

type FaqSection = 'players' | 'admins';

export default function Faq() {
    const auth = useSelector((state: RootState) => state.auth);
    const [activeSection, setActiveSection] = useState<FaqSection>(auth.role === 'admin' ? 'admins' : 'players');

    return (
        <>
            <p><Link className="icon icon--back" to={auth.value ? '/settings' : '/'}>Zurück</Link></p>
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
                        Vereine können den kostenlosen Basic-Plan mit bis zu {PLAN_CONFIG.basic.membersLimit} aktiven Mitgliedern nutzen. Der Pro-Plan ohne Begrenzung der Mitgliederzahl kostet {PLAN_CONFIG.pro.price} € pro Monat.
                    </p>

                    <h2>Wie funktioniert das Mitgliederlimit im Basic-Plan?</h2>
                    <p>Das Mitgliederlimit begrenzt nur, wie viele Mitglieder gleichzeitig aktiv sein können. Wenn Ihr Verein bereits über dem Limit liegt, bleiben bestehende aktive Mitglieder erhalten, aber es können keine weiteren inaktiven oder neuen Mitglieder aktiviert werden, bis die Zahl der Vereinsmitglieder wieder unter das Limit des Plans fällt.</p>

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
