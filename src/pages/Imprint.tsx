import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { Link } from 'react-router';

type AdminContact = {
    first_name: string;
    last_name: string;
    email: string;
}

export default function Imprint() {
    const auth = useSelector((state: RootState) => state.auth);
    const [adminContact, setAdminContact] = useState<AdminContact | null>(null);
    const subject = `abzumplatz: Feedback von ${auth.first_name} ${auth.last_name}`;
    const reservationRequestSubject = 'abzumplatz: Anfrage zur Platzreservierung';

    useEffect(() => {
        if (!auth.value || !auth.club_id) return;

        fetch(`/api/users?club_id=${auth.club_id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Could not load admin contact');
                }
                return res.json();
            })
            .then(users => {
                const admin = users.find((user: AdminContact & { role: string }) => user.role === 'admin');
                if (admin) {
                    setAdminContact(admin);
                }
            })
            .catch(error => console.error(error));
    }, [auth.value, auth.club_id]);

    return (
        <div>
            <Link className="icon icon--back" to={auth.value ? '/profile' : '/'}>Zurück</Link>
            <h2>Impressum</h2>
            <p>Angaben gemäß § 5 TMG:</p>
            <p>
                Saeid Mohadjer<br />
                Denzlingerstr. 20<br />
                79108 Freiburg im Breisgau<br />
                Deutschland</p>
            <p>Support:  <a href={`mailto:abzumplatz@gmail.com?subject=${subject}`}>abzumplatz@gmail.com</a></p>
            {adminContact ? (
                <p>
                    Anfragen zur Platzreservierung: {' '}
                    <a href={`mailto:${adminContact.email}?subject=${reservationRequestSubject}`}>
                        {adminContact.first_name} {adminContact.last_name}
                    </a>
                </p>
            ) : null}
            <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Saeid Mohadjer (Anschrift wie oben)</p>
        </div>
    )
}
