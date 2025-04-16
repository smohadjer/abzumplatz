import { ForgotPassword } from '../components/forgotPassword/ForgotPassword';

export default function ForgotPasswordPage() {
    return (
        <>
            <h2>Passwort vergessen?</h2>
            <p>Wenn Sie Ihr Passwort vergessen haben, können Sie ein neues Passwort festlegen. Geben Sie dazu unten Ihre E-Mail-Adresse ein und klicken Sie auf den Link zum Zurücksetzen des Passworts, den wir Ihnen per E-Mail zuschicken. Der Link verfällt nach einer Stunde.</p>
            <ForgotPassword />
        </>
    )
}
