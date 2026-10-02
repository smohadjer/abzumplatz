import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchUsers } from '../utils/utils';
import ContactForm from '../components/ContactForm';
import BackButton from '../components/BackButton';

type AdminContact = {
    first_name: string;
    last_name: string;
    email: string;
};

export default function Support() {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);
    const usersData = useSelector((state: RootState) => state.users);
    const hasUsersForCurrentClub = Boolean(auth.club_id) && usersData.loaded && usersData.clubId === auth.club_id;
    const adminContact = hasUsersForCurrentClub
        ? usersData.value.find((user): user is AdminContact & { role: string; status: string; _id: string } => {
            return user.role === 'admin' && Boolean(user.email);
        })
        : undefined;
    const reservationRequestSubject = 'abzumplatz: Anfrage zur Platzreservierung';

    useEffect(() => {
        if (!auth.club_id || hasUsersForCurrentClub) return;

        fetchUsers(auth.club_id, dispatch);
    }, [auth.club_id, hasUsersForCurrentClub, dispatch]);

    return (
        <>
            {!auth.value ? <p><BackButton /></p> : null}
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
                <a href="mailto:support@abzumplatz.de">support@abzumplatz.de</a> oder nutzen Sie das Kontaktformular.
            </p>
            <h2>Kontaktformular</h2>
            <ContactForm />
        </>
    );
}
