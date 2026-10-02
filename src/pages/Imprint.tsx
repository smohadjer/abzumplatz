import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'
import { Link } from 'react-router';
import { RootState } from './../store';
import BackButton from '../components/BackButton';

export default function Imprint() {
    const auth = useSelector((state: RootState) => state.auth);
    const subject = `abzumplatz: Feedback von ${auth.first_name} ${auth.last_name}`;
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (!auth.value) {
            setPhone('');
            return;
        }

        const controller = new AbortController();
        fetch('/api/auth?action=contact', {signal: controller.signal})
            .then(response => response.ok ? response.json() : null)
            .then(data => setPhone(typeof data?.phone === 'string' ? data.phone : ''))
            .catch(error => {
                if (error.name !== 'AbortError') setPhone('');
            });

        return () => controller.abort();
    }, [auth.value]);

    return (
        <div>
            {!auth.value ? <p><BackButton /></p> : null}
            <h1>Impressum</h1>
            <p>Angaben gemäß § 5 DDG:</p>
            <p>
                Saeid Mohadjer<br />
                Denzlingerstr. 20<br />
                79108 Freiburg im Breisgau<br />
                Deutschland</p>
            <p>
                {phone ? <>
                    Telefon: <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a><br />
                </> : null}
                E-Mail: <a href={`mailto:info@abzumplatz.de?subject=${subject}`}>info@abzumplatz.de</a>
            </p>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE287169201</p>
            <p>Sie können uns auch über das <Link to="/support">Kontaktformular</Link> erreichen.</p>
        </div>
    )
}
