import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { RootState } from '../store';
import { fetchUsers } from '../utils/utils';
import packageJson from '../../package.json';

type AdminContact = {
    first_name: string;
    last_name: string;
    email: string;
};

export default function Support() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const usersData = useSelector((state: RootState) => state.users);
    const clubs = useSelector((state: RootState) => state.clubs.value);
    const clubData = useSelector((state: RootState) => state.club);
    const clubName = clubs.find(club => club._id === auth.club_id)?.name
        ?? (clubData.value._id === auth.club_id ? clubData.value.name : undefined);
    const hasUsersForCurrentClub = Boolean(auth.club_id) && usersData.loaded && usersData.clubId === auth.club_id;
    const adminContact = hasUsersForCurrentClub
        ? usersData.value.find((user): user is AdminContact & { role: string; status: string; _id: string } => {
            return user.role === 'admin' && Boolean(user.email);
        })
        : undefined;
    const reservationRequestSubject = 'abzumplatz: Anfrage zur Platzreservierung';
    const supportSubject = 'abzumplatz: Feedback und Support';
    const supportDetails = [
        '',
        '',
        '--- Technische Informationen ---',
        `App-Version: ${packageJson.version}`,
        `Zeitpunkt: ${new Date().toISOString()}`,
        `Zeitzone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `Seite: ${typeof window !== 'undefined' ? window.location.href : 'Unbekannt'}`,
        `Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unbekannt'}`,
        `Sprache: ${typeof navigator !== 'undefined' ? navigator.language : 'Unbekannt'}`,
        `Fenstergröße: ${typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : 'Unbekannt'}`,
        `Angemeldet: ${auth.value ? 'Ja' : 'Nein'}`,
        `Spieler: ${auth.value ? `${auth.first_name} ${auth.last_name}`.trim() : 'Keiner'}`,
        `Rolle: ${auth.role || 'Keine'}`,
        `Club: ${clubName || 'Keiner'}`
    ].join('\n');
    const technicalSupportHref = `mailto:support@abzumplatz.de?subject=${encodeURIComponent(supportSubject)}&body=${encodeURIComponent(supportDetails)}`;

    useEffect(() => {
        if (!auth.club_id || hasUsersForCurrentClub) return;

        fetchUsers(auth.club_id, dispatch);
    }, [auth.club_id, hasUsersForCurrentClub, dispatch]);

    return (
        <>
            <p><Link className="icon icon--back" to={auth.value ? '/settings' : '/'}>Zurück</Link></p>
            <h1>Support</h1>
            {adminContact ? (
                <p>
                    Anfragen zur Platzreservierung: {' '}
                    <a href={`mailto:${adminContact.email}?subject=${reservationRequestSubject}`}>
                        {adminContact.first_name} {adminContact.last_name}
                    </a>
                </p>
            ) : null}
            <p>
                Wir freuen uns über jedes Feedback unserer Nutzerinnen und Nutzer und bemühen uns, vorgeschlagene Verbesserungen und noch fehlende Funktionen zeitnah umzusetzen. Wenn Sie auf ein technisches Problem stoßen oder einen Fehler entdecken, beschreiben Sie es bitte möglichst detailliert und fügen Sie nach Möglichkeit einen Screenshot hinzu. Feedback jeder Art, Verbesserungsvorschläge und Fehlermeldungen senden Sie bitte an {' '}
                <a href={technicalSupportHref}>support@abzumplatz.de</a>.
            </p>
        </>
    );
}
