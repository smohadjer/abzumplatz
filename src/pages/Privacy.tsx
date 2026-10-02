import BackButton from '../components/BackButton';
import './legal.css';

export default function Privacy() {
    return (
        <article className="legal-page">
            <p><BackButton /></p>
            <h1>Datenschutzerklärung</h1>
            <p>Stand: 2. Oktober 2026</p>

            <h2>1. Verantwortlicher</h2>
            <p>
                Saeid Mohadjer<br />
                Denzlingerstr. 20<br />
                79108 Freiburg im Breisgau<br />
                Deutschland<br />
                E-Mail: <a href="mailto:info@abzumplatz.de">info@abzumplatz.de</a>
            </p>

            <h2>2. Welche Daten wir verarbeiten</h2>
            <p>Je nach Nutzung von abzumplatz verarbeiten wir insbesondere:</p>
            <ul>
                <li>Kontodaten wie Name, E-Mail-Adresse, Passwort-Hash, Rolle, Status und Vereinszuordnung,</li>
                <li>freiwillige Profildaten wie Geburtsjahr und Geschlecht,</li>
                <li>Reservierungsdaten wie Platz, Datum, Uhrzeit, Bezeichnung sowie Serien- und Löschinformationen,</li>
                <li>Turnierdaten wie Meldungen, Konkurrenzen, Teilnehmer und Ergebnisse,</li>
                <li>Benachrichtigungs- und Supportdaten einschließlich Nachrichten und der für die Bearbeitung erforderlichen Kontaktdaten,</li>
                <li>Vereins-, Tarif-, Rechnungs- und Abrechnungsdaten von Vereinsadministratoren sowie</li>
                <li>technische Daten, die beim Betrieb anfallen, etwa IP-Adresse, Zeitpunkt, aufgerufene Ressource, Geräte- und Browserinformationen sowie Sicherheitsprotokolle.</li>
            </ul>

            <h2>3. Zwecke und Rechtsgrundlagen</h2>
            <p>
                Wir verarbeiten Daten, um Konten bereitzustellen, Vereine zu verwalten, Reservierungen und Turniere durchzuführen,
                Benachrichtigungen zu versenden, Support zu leisten und kostenpflichtige Tarife abzurechnen. Grundlage ist insbesondere
                Art. 6 Abs. 1 Buchst. b DSGVO (Vertrag und vorvertragliche Maßnahmen). Gesetzlich erforderliche Aufbewahrung und
                Abrechnung erfolgen nach Art. 6 Abs. 1 Buchst. c DSGVO. Sicherheit, Missbrauchsverhinderung und zuverlässiger Betrieb
                beruhen auf unserem berechtigten Interesse nach Art. 6 Abs. 1 Buchst. f DSGVO. Soweit wir ausdrücklich eine Einwilligung
                einholen, ist Art. 6 Abs. 1 Buchst. a DSGVO die Rechtsgrundlage; eine Einwilligung kann jederzeit für die Zukunft widerrufen werden.
            </p>

            <h2>4. Zugriff durch Vereinsadministratoren</h2>
            <p>
                Administratoren des ausgewählten Vereins können die für Mitgliederverwaltung, Reservierungen und Turniere erforderlichen
                Konten-, Profil- und Nutzungsdaten ihres Vereins einsehen und bearbeiten. Fragen zur vereinsinternen Nutzung dieser Daten
                können Sie auch direkt an Ihren Verein richten.
            </p>

            <h2>5. Empfänger und Dienstleister</h2>
            <p>
                Für den technischen Betrieb setzen wir insbesondere Vercel für Hosting und Serverfunktionen, MongoDB Atlas für die
                Datenbank und Fastmail für den E-Mail-Versand ein. Diese Anbieter erhalten Daten nur, soweit dies für ihre jeweilige
                Leistung erforderlich ist, und werden entsprechend den datenschutzrechtlichen Anforderungen eingebunden. Eine Verarbeitung
                außerhalb des Europäischen Wirtschaftsraums kann dabei nicht ausgeschlossen werden; sie erfolgt nur auf Grundlage der
                gesetzlichen Voraussetzungen, etwa eines Angemessenheitsbeschlusses oder geeigneter Garantien wie Standardvertragsklauseln.
            </p>

            <h2>6. Speicherdauer und Löschung</h2>
            <p>
                Wir speichern personenbezogene Daten nur so lange, wie sie für die genannten Zwecke und den Betrieb des Kontos benötigt
                werden. Nach Löschung eines Kontos oder Vereins werden Daten gelöscht oder anonymisiert, soweit keine gesetzlichen
                Aufbewahrungspflichten, Sicherheitsinteressen oder offenen Ansprüche entgegenstehen. Rechnungs- und steuerrelevante Daten
                können entsprechend den gesetzlichen Fristen länger gespeichert werden. Sicherungs- und technische Protokolldaten werden
                nach Ablauf der für Betrieb und Sicherheit erforderlichen Fristen gelöscht.
            </p>

            <h2>7. Cookies und lokale Speicherung</h2>
            <p>
                Für angemeldete Nutzer setzen wir ein technisch notwendiges, vor JavaScript geschütztes Authentifizierungs-Cookie ein.
                Es dient ausschließlich der Anmeldung und Sitzungssicherheit. Im Browser können außerdem technisch notwendige lokale
                Einstellungen gespeichert werden, beispielsweise bereits angezeigte Turnierhinweise. Wir verwenden derzeit keine
                Analyse- oder Werbe-Cookies.
            </p>

            <h2>8. Ihre Rechte</h2>
            <p>
                Sie haben nach Maßgabe der DSGVO insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
                Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen können Sie mit Wirkung für die Zukunft widerrufen. Zur Ausübung
                Ihrer Rechte schreiben Sie an <a href="mailto:info@abzumplatz.de">info@abzumplatz.de</a>. Außerdem können Sie sich bei einer
                Datenschutzaufsichtsbehörde beschweren, insbesondere beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit
                Baden-Württemberg.
            </p>

            <h2>9. Änderungen</h2>
            <p>Wir aktualisieren diese Datenschutzerklärung, wenn sich Funktionen, Dienstleister oder rechtliche Anforderungen ändern.</p>
        </article>
    );
}
