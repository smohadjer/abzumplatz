import { ForgotPassword } from '../components/forgotPassword/ForgotPassword';
import { Link } from 'react-router';

export default function ForgotPasswordPage() {
    return (
        <>
            <Link className="icon icon--back" to="/login">Zurück</Link>
            <h2>Passwort vergessen?</h2>
            <p>Wenn Sie Ihr Passwort vergessen haben, können Sie ein neues Passwort festlegen. Geben Sie dazu unten Ihre E-Mail-Adresse ein und klicken Sie auf den Link zum Zurücksetzen des Passworts, den wir Ihnen per E-Mail zuschicken. Der Link verfällt nach einer Stunde. Wenn Sie keine E-Mail in Ihrem Posteingang erhalten, überprüfen Sie Ihren Junk-Mail-Ordner.</p>
            <ForgotPassword />
        </>
    )
}
