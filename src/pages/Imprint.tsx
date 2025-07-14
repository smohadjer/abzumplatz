import { useSelector } from 'react-redux'
import { RootState } from './../store';
import { Link } from 'react-router';

export function Imprint() {
    const auth = useSelector((state: RootState) => state.auth);
    const subject = `abzumplatz: Feedback von ${auth.first_name} ${auth.last_name}`;

    return (
        <div>
            <Link to="/profile">Back</Link>
            <h2>Impressum</h2>
            <p>Angaben gemäß § 5 TMG:</p>
            <p>
                Saeid Mohadjer<br />
                Denzlingerstr. 20<br />
                79108 Freiburg im Breisgau<br />
                Deutschland</p>
            <p>Email:  <a href={`mailto:abzumplatz@gmail.com?subject=${subject}`}>abzumplatz@gmail.com</a></p>
            <p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Saeid Mohadjer (Anschrift wie oben)</p>
            <p>Die App wird mit Open-Source-Technologien erstellt und betrieben, lediglich TypeScript und React im Frontend sowie Node.js und MongoDB im Backend. Sie wird auf GitHub gehostet und über das Edge-Netzwerk von Vercel bereitgestellt.</p>
        </div>
    )
}
