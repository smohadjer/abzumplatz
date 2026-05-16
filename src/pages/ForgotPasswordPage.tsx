import { useState } from 'react';
import { ForgotPassword } from '../components/forgotPassword/ForgotPassword';
import { Link } from 'react-router';

export default function ForgotPasswordPage() {
    const [linkSent, setLinkSent] = useState(false);

    return (
        <>
            <h1>Passwort vergessen?</h1>
            <Link className="icon icon--back" to="/login">Zurück</Link>
            {linkSent ? (
                <p>Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail-Adresse gesendet.</p>
            ) : (
                <>
                    <p>Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts. Der Link verfällt nach einer Stunde.</p>
                    <ForgotPassword onSuccess={() => setLinkSent(true)} />
                </>
            )}
        </>
    )
}
