import { ResetPassword } from '../components/resetPassword/ResetPassword';
import { Link } from 'react-router';

export default function ResetPasswordPage() {
    return (
        <>
            <h1>Passwort zurücksetzen</h1>
            <p>Geben Sie ein neues Passwort ein, um Ihr Kontopasswort zurückzusetzen. If your token has expired, you can request a new token to be emailed to you <Link to="/forgot-password">here</Link>.</p>
            <ResetPassword />
        </>
    )
}
