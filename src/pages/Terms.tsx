import { Link } from 'react-router';
import BackButton from '../components/BackButton';
import './legal.css';

export default function Terms() {
    return (
        <article className="legal-page">
            <p><BackButton /></p>
            <h1>Nutzungsbedingungen</h1>
            <p>Stand: 3. Oktober 2026</p>

            <h2>1. Geltungsbereich und Anbieter</h2>
            <p>
                Diese Bedingungen gelten für die Nutzung der Plattform „abzumplatz“, erreichbar unter abzumplatz.de. Anbieter ist Saeid Mohadjer, Denzlingerstr. 20,
                79108 Freiburg im Breisgau, E-Mail: <a href="mailto:info@abzumplatz.de">info@abzumplatz.de</a>.
            </p>

            <h2>2. Konto und Zugang</h2>
            <p>
                Für die Nutzung geschützter Funktionen ist ein Konto erforderlich. Angaben müssen richtig und aktuell sein.
                Zugangsdaten dürfen nicht weitergegeben werden. Nutzer müssen uns unverzüglich informieren, wenn sie einen
                unbefugten Zugriff vermuten. Vereinsadministratoren sind für die Verwaltung der Rollen und Zugänge ihres Vereins verantwortlich.
            </p>

            <h2>3. Reservierungen und Turniere</h2>
            <p>
                abzumplatz stellt die technische Plattform für Reservierungen, Turniere und Vereinsverwaltung bereit. Die jeweiligen
                Vereinsregeln, Platzverfügbarkeit und Entscheidungen des Vereins bleiben maßgeblich. Eine angezeigte Reservierung begründet
                keine weitergehenden Ansprüche gegenüber dem Anbieter. Nutzer dürfen nur berechtigte Buchungen und Meldungen vornehmen.
            </p>

            <h2>4. Zulässige Nutzung</h2>
            <p>
                Die Plattform darf nicht missbräuchlich, rechtswidrig oder zur Beeinträchtigung anderer Nutzer oder des technischen Betriebs
                verwendet werden. Automatisierte Zugriffe, Umgehungen von Beschränkungen und das Einstellen rechtswidriger Inhalte sind untersagt.
                Bei erheblichen oder wiederholten Verstößen können Funktionen oder Konten vorübergehend gesperrt oder beendet werden.
            </p>

            <h2>5. Tarife und Abrechnung</h2>
            <p>
                Für Vereine können kostenlose und kostenpflichtige Tarife angeboten werden. Preis, Leistungsumfang und Abrechnungszeitraum
                werden vor Auswahl eines kostenpflichtigen Tarifs angezeigt. Gesetzliche Rechte, insbesondere zwingende Verbraucherrechte,
                bleiben unberührt.
            </p>
            <p>
                Der Pro-Plan wird jährlich abgerechnet. Innerhalb von 30 Tagen nach erstmaligem Abschluss kann der Pro-Plan mit sofortiger
                Wirkung widerrufen werden; der vollständige Rechnungsbetrag wird erstattet. Nach Ablauf dieser Frist wirkt eine Kündigung zum
                Ende des laufenden Abrechnungsjahres. Eine anteilige Erstattung für den verbleibenden Zeitraum wird nicht angeboten.
            </p>

            <h2>6. Verfügbarkeit und Haftung</h2>
            <p>
                Wir bemühen uns um einen zuverlässigen Betrieb, können aber keine ununterbrochene Verfügbarkeit garantieren. Für Vorsatz und
                grobe Fahrlässigkeit sowie für Schäden aus der Verletzung von Leben, Körper oder Gesundheit haften wir nach den gesetzlichen
                Vorschriften. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den typischerweise
                vorhersehbaren Schaden begrenzt. Zwingende gesetzliche Haftung bleibt unberührt.
            </p>

            <h2>7. Beendigung und Daten</h2>
            <p>
                Spieler können ihr Konto nach Eingabe ihres Passworts selbst über das Kontomenü löschen. Vereinsadministratoren können
                die Löschung ihres Vereins über die Administrationsfunktionen veranlassen. Für die Löschung eines Administratorkontos
                wenden Sie sich bitte an den Anbieter. Gesetzliche Aufbewahrungspflichten und die Hinweise in der
                <Link to="/privacy">Datenschutzerklärung</Link> bleiben unberührt.
            </p>

            <h2>8. Änderungen und anwendbares Recht</h2>
            <p>
                Wesentliche Änderungen dieser Bedingungen werden in geeigneter Weise mitgeteilt. Es gilt deutsches Recht unter Ausschluss des
                UN-Kaufrechts. Zwingende Verbraucherschutzvorschriften des Staates, in dem ein Verbraucher seinen gewöhnlichen Aufenthalt hat,
                bleiben unberührt.
            </p>
        </article>
    );
}
