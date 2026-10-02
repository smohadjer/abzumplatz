import { ResetPassword } from '../components/resetPassword/ResetPassword';
import { Link } from 'react-router';

export default function ResetPasswordPage() {
    return (
        <>
            <h1>Passwort zurücksetzen</h1>
            <p>Geben Sie ein neues Passwort ein, um Ihr Kontopasswort zurückzusetzen. Falls Ihr Link abgelaufen ist, können Sie sich <Link to="/forgot-password">hier einen neuen Link per E-Mail zusenden lassen</Link>.</p>
            <ResetPassword />
        </>
    )
}
