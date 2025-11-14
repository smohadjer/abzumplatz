import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { Link } from 'react-router';

export default function Imprint() {
    const auth = useSelector((state: RootState) => state.auth);
    const subject = `abzumplatz: Feedback von ${auth.first_name} ${auth.last_name}`;

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
            <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Saeid Mohadjer (Anschrift wie oben)</p>
        </div>
    )
}
