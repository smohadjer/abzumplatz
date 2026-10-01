import { Link } from 'react-router';
import AdminBackButton from '../../components/AdminBackButton';
import '../settings.css';

const setupSteps = [
    {
        title: 'Vereinsdaten überprüfen',
        description: 'Kontrollieren Sie Vereinsname, Anschrift, Öffnungszeiten und Zeitzone.',
        to: '/admin/club',
    },
    {
        title: 'Plätze sperren',
        description: 'Sperren Sie bei Bedarf einzelne Plätze, die nicht online gebucht werden sollen.',
        to: '/admin/courts',
    },
    {
        title: 'Reservierungsregeln festlegen',
        description: 'Passen Sie die Regeln für Buchungsdauer und Reservierungslimits an Ihren Verein an.',
        to: '/admin/rules',
    },
    {
        title: 'Testreservierung durchführen',
        description: 'Öffnen Sie den Kalender und testen Sie den Ablauf einer Platzreservierung.',
        to: '/reservations',
    },
    {
        title: 'Mitglieder einladen',
        description: 'Teilen Sie den Einladungslink, sobald alles für Ihre Mitglieder bereit ist.',
        to: '/admin/invite',
    },
];

export default function AdminChecklistPage() {
    return (
        <>
            <p><AdminBackButton /></p>
            <h1>Einrichtungscheckliste</h1>
            <p>Gehen Sie diese Schritte in Ruhe durch, bevor Sie Ihre Mitglieder einladen.</p>
            <ol className="admin-checklist">
                {setupSteps.map(step => (
                    <li key={step.to}>
                        <Link
                            to={step.to}
                            state={{fromAdminChecklist: true}}
                        >
                            <strong>{step.title}</strong>
                            <span>{step.description}</span>
                        </Link>
                    </li>
                ))}
            </ol>
        </>
    );
}
