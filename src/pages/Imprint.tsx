import { useSelector } from 'react-redux'
import { Link } from 'react-router';
import { RootState } from './../store';

export default function Imprint() {
    const auth = useSelector((state: RootState) => state.auth);
    const subject = `abzumplatz: Feedback von ${auth.first_name} ${auth.last_name}`;

    return (
        <div>
            <p><Link className="icon icon--back" to="/settings">Zurück</Link></p>
            <h1>Impressum</h1>
            <p>Angaben gemäß § 5 TMG:</p>
            <p>
                Saeid Mohadjer<br />
                Denzlingerstr. 20<br />
                79108 Freiburg im Breisgau<br />
                Deutschland</p>
            <p><a href={`mailto:info@abzumplatz.de?subject=${subject}`}>info@abzumplatz.de</a></p>
            <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Saeid Mohadjer (Anschrift wie oben)</p>
        </div>
    )
}
